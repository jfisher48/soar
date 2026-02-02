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

    const PIZZA_MODULE_HEIGHT = 2 * INCH;
    const PIZZA_GAP_ABOVE = 0.20 * INCH;

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

    const pizzaModuleY = zoneY;
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
    mustBeNumber("STRIPE_H", PIZZA_STRIPE_H);
    mustBeNumber("STRIPE_INSET", PIZZA_STRIPE_INSET);
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

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, "../output/jockos-test.pdf");

    fs.writeFileSync(outPath, pdfBytes);

    console.log("PDF written to:", outPath);    
}

run().catch(console.error);