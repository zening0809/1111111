const inAndroid = /Android/i
const inIOS = /iPhone|iPad|iPod/i
const inMicroMessenger = /MicroMessenger/i
const inWindowsWechat = /WindowsWechat/i

export function isIOSWeChat() {
  if (!process.browser) {
    return false
  }
  const ua = navigator.userAgent
  return inIOS.test(ua) && inMicroMessenger.test(ua)
}
