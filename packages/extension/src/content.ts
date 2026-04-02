/* oxlint-disable no-unsafe-member-access, no-unsafe-call -- Chrome extension API types not resolved by oxlint */
import type { ExtensionMessage, PageInfo } from "./types.js";

const getMetaContent = (selector: string): string => {
  const el = document.querySelector(selector);
  return el?.getAttribute("content") ?? "";
};

const buildPageInfo = (): PageInfo => ({
  description:
    getMetaContent('meta[name="description"]') || getMetaContent('meta[property="og:description"]'),
  ogImage: getMetaContent('meta[property="og:image"]'),
  selectedText: globalThis.getSelection()?.toString() ?? "",
  title: document.title,
  url: globalThis.location.href,
});

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: PageInfo) => void,
  ) => {
    if (message.type === "GET_PAGE_INFO") {
      sendResponse(buildPageInfo());
    }
    return true;
  },
);
