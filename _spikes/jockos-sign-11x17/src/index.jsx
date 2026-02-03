const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts, pushGraphicsState, popGraphicsState, setFillingColor, setStrokingColor, setLineWidth, moveTo, lineTo, closePath, fill, stroke } = require("pdf-lib");

function hexToRgb(hex) {
    const clean = hex.trim().replace("#", "");

    if (clean.length !==6) {
        throw new Error(`Invalid hex color: ${hex}`);
    }
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;

    return rgb(r, g, b);
}

function drawFilledTriangle(page, p1, p2, p3, fillColor, strokeColor = null, strokeWidth = 0) {
  const ops = [
    pushGraphicsState(),
    setFillingColor(fillColor),
    moveTo(p1.x, p1.y),
    lineTo(p2.x, p2.y),
    lineTo(p3.x, p3.y),
    closePath(),
    fill()
  ];

  if (strokeColor && strokeWidth > 0) {
    ops.push(
      setStrokingColor(strokeColor),
      setLineWidth(strokeWidth),
      moveTo(p1.x, p1.y),
      lineTo(p2.x, p2.y),
      lineTo(p3.x, p3.y),
      closePath(),
      stroke()
    );
  }

  ops.push(popGraphicsState());
  page.pushOperators(...ops);
}

function fitFontSizeToWidth(font, text, maxWidth, startSize, minSize) {
  let size = startSize;
  while (size >= minSize) {
    const w = font.widthOfTextAtSize(text, size);
    if (w <= maxWidth) return size;
    size -= 1;
  }
  return minSize;
}

function wrapTextToWidth(font, text, fontSize, maxWidth, maxLines = 2) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const w = font.widthOfTextAtSize(test, fontSize);
    if (w <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);

  // If we still have leftover words, append ellipsis to last line (optional)
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    let trimmed = last;
    while (trimmed.length > 0 && font.widthOfTextAtSize(trimmed + "…", fontSize) > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    lines[maxLines - 1] = trimmed ? trimmed + "…" : last;
  }

  return lines;
}

function drawSpecialCard(page, {
  x, y, w, h,
  title, desc, price,
  font,
  color,
  INCH,
  BASELINE_TWEAK,
  debugBorder = false
}) {
  // Force ALL CAPS and handle null/undefined gracefully
  const T = (title ?? "").toString().trim().toUpperCase();
  const D = (desc ?? "").toString().trim().toUpperCase();
  const P = (price ?? "").toString().trim().toUpperCase();

  const hasTitle = T.length > 0;
  const hasDesc  = D.length > 0;
  const hasPrice = P.length > 0;

  // If literally nothing, don't draw anything
  if (!hasTitle && !hasDesc && !hasPrice) return;

  // Inner padding inside the card
  const padX = 0.40 * INCH;
  const padY = 0.40 * INCH;

  const innerX = x + padX;
  const innerY = y + padY;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  // Gaps (only applied when both sections exist)
  const gapTitleToDesc = 0.10 * INCH;
  const gapDescToPrice = 0.18 * INCH;
  const lineGapTitle = 0.06 * INCH;
  const lineGapDesc = 0.05 * INCH;

  // Start sizes (big)
  let titleSize = 62;
  let descSize  = 34;
  let priceSize = 82;

  const MIN_TITLE = 24;
  const MIN_DESC  = 18;
  const MIN_PRICE = 32;

  const maxTitleLines = 2;
  const maxDescLines  = 2;

  const measure = (tSize, dSize, pSize) => {
    const tLines = hasTitle ? wrapTextToWidth(font, T, tSize, innerW, maxTitleLines) : [];
    const dLines = hasDesc  ? wrapTextToWidth(font, D, dSize, innerW, maxDescLines)  : [];

    const titleTooWide = tLines.some(l => font.widthOfTextAtSize(l, tSize) > innerW);
    const descTooWide  = dLines.some(l => font.widthOfTextAtSize(l, dSize) > innerW);
    const priceTooWide = hasPrice ? (font.widthOfTextAtSize(P, pSize) > innerW) : false;

    const tLineH = hasTitle ? font.heightAtSize(tSize) : 0;
    const dLineH = hasDesc  ? font.heightAtSize(dSize) : 0;
    const pH     = hasPrice ? font.heightAtSize(pSize) : 0;

    const tH = hasTitle ? (tLines.length * tLineH + (tLines.length - 1) * lineGapTitle) : 0;
    const dH = hasDesc  ? (dLines.length * dLineH + (dLines.length - 1) * lineGapDesc) : 0;

    // Conditional gaps
    const gapTD = (hasTitle && hasDesc) ? gapTitleToDesc : 0;
    const gapDP = (hasDesc && hasPrice) ? gapDescToPrice : 0;
    const gapTP = (hasTitle && !hasDesc && hasPrice) ? gapDescToPrice : 0; // title→price gap when no desc

    const contentH = tH + gapTD + dH + (hasDesc ? gapDP : gapTP) + pH;

    return { tLines, dLines, tSize, dSize, pSize, tLineH, dLineH, pH, tH, dH, contentH, titleTooWide, descTooWide, priceTooWide, gapTD, gapBetweenTextAndPrice: (hasDesc ? gapDP : gapTP) };
  };

  let m = measure(titleSize, descSize, priceSize);

  // Shrink loop: reduce until it fits and nothing exceeds width
  while (
    (m.contentH > innerH || m.titleTooWide || m.descTooWide || m.priceTooWide) &&
    (titleSize > MIN_TITLE || descSize > MIN_DESC || priceSize > MIN_PRICE)
  ) {
    // shrink what exists; keep price dominant but allow it to shrink if needed
    if (hasTitle && (m.contentH > innerH || m.titleTooWide)) titleSize -= 2;
    if (hasDesc  && (m.contentH > innerH || m.descTooWide))  descSize  -= 1;
    if (hasPrice && (m.contentH > innerH || m.priceTooWide)) priceSize -= 2;

    if (titleSize < MIN_TITLE) titleSize = MIN_TITLE;
    if (descSize  < MIN_DESC)  descSize  = MIN_DESC;
    if (priceSize < MIN_PRICE) priceSize = MIN_PRICE;

    m = measure(titleSize, descSize, priceSize);
  }

  if (debugBorder) {
    page.drawRectangle({
      x, y, width: w, height: h,
      borderColor: color,
      borderWidth: 1
    });
    page.drawRectangle({
      x: innerX, y: innerY, width: innerW, height: innerH,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5
    });
  }

  // Center the full content stack in the inner rect
  let cursorY = innerY + (innerH + m.contentH) / 2; // top edge of content block

  // Draw title
  if (hasTitle) {
    cursorY -= m.tLineH;
    for (let i = 0; i < m.tLines.length; i++) {
      const line = m.tLines[i];
      const lineW = font.widthOfTextAtSize(line, m.tSize);
      page.drawText(line, {
        x: innerX + (innerW - lineW) / 2,
        y: cursorY + BASELINE_TWEAK,
        size: m.tSize,
        font,
        color
      });
      cursorY -= (m.tLineH + lineGapTitle);
    }
    cursorY += lineGapTitle; // undo last extra gap
  }

  // Gap between title and desc
  if (hasTitle && hasDesc) cursorY -= m.gapTD;

  // Draw desc
  if (hasDesc) {
    cursorY -= m.dLineH;
    for (let i = 0; i < m.dLines.length; i++) {
      const line = m.dLines[i];
      const lineW = font.widthOfTextAtSize(line, m.dSize);
      page.drawText(line, {
        x: innerX + (innerW - lineW) / 2,
        y: cursorY + BASELINE_TWEAK,
        size: m.dSize,
        font,
        color
      });
      cursorY -= (m.dLineH + lineGapDesc);
    }
    cursorY += lineGapDesc;
  }

  // Gap before price (depends on whether desc exists)
  if (hasPrice && (hasTitle || hasDesc)) cursorY -= m.gapBetweenTextAndPrice;

  // Draw price
  if (hasPrice) {
    cursorY -= m.pH;
    const priceW = font.widthOfTextAtSize(P, m.pSize);
    page.drawText(P, {
      x: innerX + (innerW - priceW) / 2,
      y: cursorY + BASELINE_TWEAK,
      size: m.pSize,
      font,
      color
    });
  }
}





const WHITE = hexToRgb("#FFFFFF");
const ULTRA_RED = hexToRgb("#c8102e");
const ULTRA_BLUE =hexToRgb("#2F4487")
const GOLD = hexToRgb("#D4AF37");

async function run() {
    const INCH = 72
    
    const PAGE_WIDTH = 11 * INCH;
    const PAGE_HEIGHT = 17 * INCH;
    
    const MARGIN = 0.25 * INCH;

    const ZONE_WIDTH = 10.25 * INCH;
    const ZONE_HEIGHT = 9 * INCH;

    const MONTH_BAR_HEIGHT = 1 * INCH;
    const STRIPE_H = 0.04 * INCH;
    const STRIPE_INSET = 0.06 * INCH;
    const GAP_BELOW_MONTH_BAR = 0.20 * INCH;

    const PIZZA_MODULE_HEIGHT = 2 * INCH;
    const GAP_ABOVE_PIZZA = 0.20 * INCH;

    const RIBBON_H = 0.7 * INCH;
    const PIZZA_STRIPE_H = 0.03 * INCH;
    const PIZZA_STRIPE_INSET = 0.05 * INCH;
    
    
    const BASELINE_TWEAK = 4; // points    

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const mustBeNumber = (name, v) => {
        if (typeof v !== "number" || Number.isNaN(v)) {
            throw new Error(`${name} is not a valid number: ${v}`);
        }
    };


    page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        color: rgb(1,1,1)
    });

    const bgPath = path.join(__dirname, "../assets/ultra-bg-11x17.png");
    const bgBytes = fs.readFileSync(bgPath);
    const bgImage =  await pdfDoc.embedPng(bgBytes);
    
    const zoneX = (PAGE_WIDTH - ZONE_WIDTH) / 2;
    const zoneY = MARGIN;

    page.drawImage(bgImage, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT
    });
    
    // -- Month Bar ---

    const barTopY = zoneY + ZONE_HEIGHT - MONTH_BAR_HEIGHT;

    page.drawRectangle({
        x: zoneX,
        y: zoneY + ZONE_HEIGHT - MONTH_BAR_HEIGHT,
        width: ZONE_WIDTH,
        height: MONTH_BAR_HEIGHT,
        color: ULTRA_RED
    });

    page.drawRectangle({
       x: zoneX,
       y: barTopY + STRIPE_INSET,
       width: ZONE_WIDTH,
       height: STRIPE_H,
       color: GOLD 
    });

    page.drawRectangle({
       x: zoneX,
       y: barTopY + MONTH_BAR_HEIGHT - STRIPE_INSET - STRIPE_H,
       width: ZONE_WIDTH,
       height: STRIPE_H,
       color: GOLD 
    });

    // -- Month Bar Text --0
    const monthText = "MARCH SPECIALS"
    const monthFontSize = 46;
    const monthTextWidth = font.widthOfTextAtSize(monthText, monthFontSize);
    const textHeight = font.heightAtSize(monthFontSize);

    page.drawText(monthText, {
        x: zoneX + (ZONE_WIDTH - monthTextWidth) / 2, //center horizontally
        y: barTopY + (MONTH_BAR_HEIGHT - textHeight) / 2 + BASELINE_TWEAK, // visually center
        size: monthFontSize,
        font,
        color: rgb(1,1,1)
    });    

    // Pizza of the Month

    const PIZZA_BOTTOM_INSET = 0.25 * INCH;
    const pizzaModuleY = zoneY + PIZZA_BOTTOM_INSET;
    const pizzaModuleTopY = pizzaModuleY + PIZZA_MODULE_HEIGHT;

    const RIBBON_W = 9.5 * INCH;
    const RIBBON_X = (PAGE_WIDTH - RIBBON_W) / 2;
    const RIBBON_Y = pizzaModuleTopY - RIBBON_H;

    const stripeY1 = RIBBON_Y + PIZZA_STRIPE_INSET;
    const stripeY2 = RIBBON_Y + RIBBON_H - PIZZA_STRIPE_INSET - PIZZA_STRIPE_H;

    // Ribbon Base
    page.drawRectangle({
        x: RIBBON_X,
        y: RIBBON_Y,
        width: RIBBON_W,
        height: RIBBON_H,
        color: ULTRA_RED
    });

    mustBeNumber("RIBBON_Y", RIBBON_Y);
    mustBeNumber("RIBBON_H", RIBBON_H);
    mustBeNumber("PIZZA_STRIPE_H", PIZZA_STRIPE_H);
    mustBeNumber("PIZZA_STRIPE_INSET", PIZZA_STRIPE_INSET);
    mustBeNumber("stripeY1", stripeY1);
    mustBeNumber("stripeY2", stripeY2);

    //Gold Stripes
    page.drawRectangle({
        x: RIBBON_X,
        y: stripeY1,
        width: RIBBON_W,
        height: PIZZA_STRIPE_H,
        color: GOLD
    });
    
    page.drawRectangle({
        x: RIBBON_X,
        y: stripeY2,
        width: RIBBON_W,
        height: PIZZA_STRIPE_H,
        color: GOLD
    });


    // Left notch
    const NOTCH_DEPTH = 0.45 * INCH;

    drawFilledTriangle(
    page,
    { x: RIBBON_X, y: RIBBON_Y },                              // bottom-left at ribbon edge
    { x: RIBBON_X + NOTCH_DEPTH, y: RIBBON_Y + RIBBON_H / 2 }, // notch point inward
    { x: RIBBON_X, y: RIBBON_Y + RIBBON_H },                   // top-left at ribbon edge
    WHITE
    );

    // Right notch
    
    drawFilledTriangle(
    page,
    { x: RIBBON_X + RIBBON_W, y: RIBBON_Y },                              // bottom-left at ribbon edge
    { x: RIBBON_X + RIBBON_W - NOTCH_DEPTH, y: RIBBON_Y + RIBBON_H / 2 }, // notch point inward
    { x: RIBBON_X + RIBBON_W, y: RIBBON_Y + RIBBON_H },                   // top-left at ribbon edge
    WHITE
    );

    
    const pizzaName = "THE BIG DILL";
    const pizzaPrices = "LG $17.99  MD $15.99  SM $11.99";

    const pizzaRibbonText = "PIZZA OF THE MONTH";
    const pizzaRibbonFontSize = 34;
    const pizzaRibbonTextWidth = font.widthOfTextAtSize(pizzaRibbonText, pizzaRibbonFontSize);
    const pizzaRibbonTextHeight = font.heightAtSize(pizzaRibbonFontSize);

    page.drawText(pizzaRibbonText, {
        x: RIBBON_X + (RIBBON_W - pizzaRibbonTextWidth) / 2,
        y: RIBBON_Y + (RIBBON_H - pizzaRibbonTextHeight) / 2 + BASELINE_TWEAK,
        size: pizzaRibbonFontSize,
        font,
        color: WHITE
    });

    // Pizza Name

    const GAP_BELOW_RIBBON = 0.233 * INCH;
    const nameFontSize = 42;
    const nameTextW = font.widthOfTextAtSize(pizzaName, nameFontSize);
    const nameTextH = font.heightAtSize(nameFontSize);

    const nameX = zoneX + (ZONE_WIDTH - nameTextW) / 2;
    const nameY = RIBBON_Y - GAP_BELOW_RIBBON - nameTextH;

    page.drawText(pizzaName, {
        x: nameX,
        y: nameY + BASELINE_TWEAK,
        size: nameFontSize,
        font,
        color: ULTRA_BLUE
    });

    // Gold Underline

    const UNDERLINE_GAP = 0.11* INCH;
    const UNDERLINE_H = 0.015 * INCH;
    const UNDERLINE_PAD = 0.125 * INCH;
    
    page.drawRectangle({
        x: nameX - UNDERLINE_PAD,
        y: nameY - UNDERLINE_GAP,
        width: nameTextW + (UNDERLINE_PAD * 2),
        height: UNDERLINE_H,
        color: GOLD
    });

    // Pizza Prices

    const GAP_BELOW_NAME = 0.15 * INCH;
    const priceFontSize = 24;
    const priceTextW = font.widthOfTextAtSize(pizzaPrices, priceFontSize);
    const priceTextH = font.heightAtSize(priceFontSize);

    const priceY = nameY - UNDERLINE_GAP - UNDERLINE_H - GAP_BELOW_NAME - priceTextH;

    page.drawText(pizzaPrices, {
        x: zoneX + (ZONE_WIDTH - priceTextW) /2,
        y: priceY + BASELINE_TWEAK,
        size: priceFontSize,
        font,
        color: ULTRA_BLUE
    });

    //Specials Zone

    const specialsTopY = barTopY - GAP_BELOW_MONTH_BAR;
    const specialsBottomY = pizzaModuleTopY + GAP_ABOVE_PIZZA;
    const specialsHeight = specialsTopY - specialsBottomY;

    console.log("Specials zone debug (inches)", {
        top: (specialsTopY / INCH).toFixed(2),
        bottom: (specialsBottomY / INCH).toFixed(2),
        height: (specialsHeight / INCH).toFixed(2)
    });

    if (specialsHeight <=0) {
        console.warn("Specials zone height is <= 0 Reduce gaps or module heights.")
    }

    page.drawRectangle({
        x: zoneX,
        y: specialsBottomY,
        width: ZONE_WIDTH,
        height: specialsHeight,
        borderColor: rgb(0,0,0),
        borderWidth: 1
    });

    // Special Card 1

    const specialTitle = "2 Individual 2-Topping Pizzas 2 Garden Salads and 2 Soft Drinks";
    const specialDesc = "";
    const specialPrice = "$34.99"

    const cardPadding = 0.25 * INCH;

    const cardX = zoneX + cardPadding;
    const cardY = specialsBottomY + cardPadding;
    const cardW = ZONE_WIDTH - (cardPadding * 2);
    const cardH = specialsHeight - (cardPadding * 2);

    drawSpecialCard(page, {
        x: cardX,
        y: cardY,
        w: cardW,
        h: cardH,
        title: specialTitle,
        desc: specialDesc,
        price: specialPrice,
        font,
        color: ULTRA_BLUE,
        INCH,
        BASELINE_TWEAK,
        debugBorder: true
    });    

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, "../output/jockos-test.pdf");

    fs.writeFileSync(outPath, pdfBytes);

    console.log("PDF written to:", outPath);    
}

run().catch(console.error);