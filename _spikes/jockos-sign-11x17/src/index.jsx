const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

async function run() {
    const PAGE_WIDTH = 11 * 72;
    const PAGE_HEIGHT = 17 * 72;
    const BOTTOM_MARGIN = 0.25 * 72;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

    const zoneWidth = 10.25 * 72;
    const zoneHeight = 9 * 72;
    const zoneX = (PAGE_WIDTH - zoneWidth) / 2;
    const zoneY = BOTTOM_MARGIN;

    page.drawImage(bgImage, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT
    });    

    // -- Month Bar ---
    const MONTH_BAR_HEIGHT = 0.75 * 72;

    page.drawRectangle({
        x: zoneX,
        y: zoneY + zoneHeight - MONTH_BAR_HEIGHT,
        width: zoneWidth,
        height: MONTH_BAR_HEIGHT,
        color: rgb(0.75, 0, 0) //placeholder red
    });

    // -- Month Bar Text --0
    const monthText = "FEBRUARY SPECIALS"
    const monthFontSize = 42;
    const monthTextWidth = font.widthOfTextAtSize(monthText, monthFontSize);
    const textHeight = font.heightAtSize(monthFontSize);

    const barTopY = zoneY + zoneHeight - MONTH_BAR_HEIGHT;

    const BASELINE_TWEAK = 4; // points

    page.drawText(monthText, {
        x: zoneX + (zoneWidth - monthTextWidth) / 2, //center horizontally
        y: barTopY + (MONTH_BAR_HEIGHT - textHeight) / 2 + BASELINE_TWEAK, // visually center
        size: monthFontSize,
        font,
        color: rgb(1,1,1)
    });

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, "../output/jockos-test.pdf");

    fs.writeFileSync(outPath, pdfBytes);

    console.log("PDF written to:", outPath);    
}

run().catch(console.error);