import { NextResponse } from "next/server"
import puppeteer from "puppeteer-core"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json(
      { message: "A url query-parameter is required" },
      { status: 400 }
    )
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://browserless.codefe.top?token=${process.env.BROWSERLESS_TOKEN}`,
  })

  const page = await browser.newPage()
  // 获取设备像素比
  const devicePixelRatio = 2
  const viewportWidth = 390

  // 先设置一个较小的初始高度
  await page.setViewport({
    width: viewportWidth,
    height: 800,
    deviceScaleFactor: devicePixelRatio,
  })

  await page.goto(url, {
    waitUntil: ["load", "networkidle2"],
    timeout: 60000,
  })



  await page.waitForSelector('#poster .cabinet-item', {
    visible: true, // 确保元素不仅存在，而且可见
    timeout: 30000 // 等待这个元素的超时时间，例如 30 秒
  });

  // === 在等待元素出现后，重新等待所有当前图片加载完成 ===
  console.log("Waiting for all images to load after element appeared...");
  await page.waitForFunction(() => {
    const posterElement = document.querySelector('#poster');
    // 如果 #poster 元素不存在，或者没有图片，则认为已完成等待或无需等待
    if (!posterElement) {
      return true;
    }
    const images = Array.from(posterElement.querySelectorAll('img')); // 查找 #poster 内的所有 img 标签

    // 如果 #poster 内没有 img 标签，也认为已完成等待
    if (images.length === 0) {
      return true;
    }

    // 检查是否所有图片都已完成加载 (complete 属性为 true 且 naturalHeight > 0 通常表示成功加载)
    const allImagesComplete = images.every(img => img.complete && img.naturalHeight > 0);

    // console.log(`Images check: found ${images.length}, complete: ${allImagesComplete}`); // 可选：用于调试

    return allImagesComplete; // 当所有图片都 complete 且 naturalHeight > 0 时，返回 true
  }, {
    timeout: 30000 // 等待图片加载的超时时间
  });
  // await new Promise(resolve => setTimeout(resolve, 3000));
  console.log("All images on the page are complete.");


  const pageHeight = await page.evaluate(() => {
    // 获取页面主要内容区域的高度
    const mainContent = document.querySelector("#poster")

    // 获取元素的完整高度，包括padding和border
    const height =
      mainContent?.getBoundingClientRect()?.height || document.body.offsetHeight

    // 考虑到可能的margin collapse，取最大值
    return Math.ceil(height);
  })

  console.log("pageHeight", pageHeight)

  // 更新viewport高度，保持移动端宽度和设备像素比
  await page.setViewport({
    width: viewportWidth,
    height: pageHeight,
    deviceScaleFactor: devicePixelRatio,
  })

  const screenshot = await page.screenshot({
    type: "webp", // 尝试使用 webp
    quality: 85, // 设置质量，
  })
  await browser.close()

  const base64Image = Buffer.from(screenshot).toString('base64');
  return NextResponse.json({
        message: "截图生成成功",
        imageData: base64Image,
        imageType: "image/webp" // 可以在这里带上图片类型信息
      }, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        }
      })
}

export const maxDuration = 60
