const GOAT_CODE = "nuts-and-bytes"

async function renderReadCount() {
  const el = document.querySelector(".read-count") as HTMLElement | null
  if (!el) return
  // location.pathname 已是浏览器编码形式,与 count.js 上报的一致;保留斜杠
  const path = location.pathname
  const url = `https://${GOAT_CODE}.goatcounter.com/counter/${path}.json`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as { count: string }
    el.textContent = `👁 已阅读 ${data.count} 次`
    el.removeAttribute("hidden")
  } catch {
    el.setAttribute("hidden", "true")
  }
}

document.addEventListener("nav", () => {
  renderReadCount()
})
