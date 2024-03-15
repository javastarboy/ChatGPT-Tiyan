import { useEffect, useRef, useState, useMemo } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import NoticeIcon from "../icons/notice.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";

import Locale from "../locales";

import { useAppConfig, useChatStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showConfirm, showToast, Modal } from "./ui-lib";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();
  // 公告弹窗用的组件
  const [showDialog, setShowDialog] = useState(true); // 控制对话框的显示状态
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-title"]} data-tauri-drag-region>
          ChatGPT4 领航猿1号
        </div>
        <div className={styles["sidebar-sub-title"]}>
          <a
            href="https://ydyrb84oyc.feishu.cn/wiki/Vxg8wAFUti3VAhksSyLc4AD3n8g"
            target="_blank"
          >
            感兴趣的小伙伴,加入社群,终身免费使用！
          </a>{" "}
          <br />
          <a
            href="https://www.jsbcp-2.top/%E5%85%AC%E4%BC%97%E5%8F%B7%E4%BA%8C%E7%BB%B4%E7%A0%81.jpg"
            target="_blank"
          >
            点我关注公众号,每日惊喜不断,干货不断！
          </a>
        </div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          <ChatGptIcon />
        </div>
      </div>

      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<MaskIcon />}
          text={shouldNarrow ? undefined : Locale.Mask.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => {
            if (config.dontShowMaskSplashScreen !== true) {
              navigate(Path.NewChat, { state: { fromHome: true } });
            } else {
              navigate(Path.Masks, { state: { fromHome: true } });
            }
          }}
          shadow
        />
        <IconButton
          icon={<PluginIcon />}
          text={shouldNarrow ? undefined : Locale.Plugin.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => showToast(Locale.WIP)}
          shadow
        />
      </div>

      <div
        className={styles["sidebar-body"]}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"] + " " + styles.mobile}>
            <IconButton
              icon={<DeleteIcon />}
              onClick={async () => {
                if (await showConfirm(Locale.Home.DeleteChat)) {
                  chatStore.deleteSession(chatStore.currentSessionIndex);
                }
              }}
            />
          </div>
          <div className={styles["sidebar-action"]}>
            <Link to={Path.Settings}>
              <IconButton icon={<SettingsIcon />} shadow />
            </Link>
          </div>
          {/* github 小猫腻按钮 */}
          {/* <div className={styles["sidebar-action"]}>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <IconButton icon={<GithubIcon />} shadow />
            </a>
          </div> */}
        </div>
        <div>
          <IconButton
            icon={<NoticeIcon />}
            text={shouldNarrow ? undefined : Locale.Notice.Name}
            className={`${styles["sidebar-bar-button"]} ${styles["centered-button"]}`}
            onClick={() => {
              setShowDialog(true); // 展示公告弹窗
              console.log("showDialog===" + showDialog);
            }}
            shadow
          />

          {/* 公共弹窗 */}
          {showDialog && (
            <div className="modal-mask">
              <Modal
                title={
                  "📣 公 告（本站已支持GPT-4交流群获取； 3 月 13 日已更新众多功能，欢迎体验）【接广告】及【代部署业务】"
                }
                // title={
                //   <span style={{ fontSize: "24px", textAlign: "center" }}>
                //     📣 公 告
                //   </span>
                // }
                onClose={() => setShowDialog(false)}
                actions={[
                  <IconButton
                    key="close"
                    bordered
                    text={"关闭"}
                    onClick={() => {
                      setShowDialog(false),
                        console.log("showDialog2===" + showDialog);
                    }}
                  />,
                  <IconButton
                    key="talk"
                    bordered
                    text={"交流"}
                    onClick={() => {
                      window.open(
                        "https://www.jsbcp-2.top/%E5%BE%AE%E4%BF%A1%E4%BA%A4%E6%B5%81%E7%BE%A4.png",
                      );
                    }}
                  />,
                  <IconButton
                    key="support"
                    bordered
                    text={"赞助"}
                    onClick={() => {
                      window.open(
                        "https://www.jsbcp-2.top/%E5%BE%AE%E4%BF%A1%E6%94%B6%E6%AC%BE%E7%A0%81.jpeg",
                      );
                    }}
                  />,
                  <IconButton
                    key="talk"
                    bordered
                    text={"个人知识库"}
                    onClick={() => {
                      window.open("https://www.yuque.com/lhyyh");
                    }}
                  />,
                  <IconButton
                    key="go"
                    bordered
                    text={"前往社群"}
                    onClick={() => {
                      window.open("https://t.zsxq.com/11ZhATvJ9");
                    }}
                  />,
                ]}
              >
                <div className={styles["markdown-body"]}>
                  ✅ 欢迎来聊聊 (更新网址、AI教程、AI资讯)▶{" "}
                  <a
                    href="https://www.jsbcp-2.top/%E5%BE%AE%E4%BF%A1%E4%BA%A4%E6%B5%81%E7%BE%A4.png"
                    target="_blank"
                  >
                    AI2.0 实验室|微信交流群
                  </a>
                  &nbsp;&nbsp;|&nbsp;&nbsp;
                  <a
                    href="https://ydyrb84oyc.feishu.cn/wiki/DsgkwJ8fdiaX68kqsIGc8tjynig"
                    target="_blank"
                  >
                    免费获取本站密码方式
                  </a>
                  {"  "}
                  <br />
                  <span style={{ color: "red" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;【因不可控因素，网址不定期更新，加微信/群不迷路！】
                  </span>
                  <br />
                  <br />
                  {/* <span>{Locale.Notice.Content}</span><br/><br/> */}✅
                  免费送价值 298 元 AIGC 学习手册 ▶&nbsp;&nbsp;
                  {/* 【涵盖ChatGPT、AI绘画、变现案例、行业报告、GPT部署...】&nbsp;<br/>&nbsp;&nbsp;&nbsp;&nbsp; */}
                  <a
                    href="https://ydyrb84oyc.feishu.cn/wiki/SOpywcxjUikIS1k1LQZcTj0unJg"
                    target="_blank"
                  >
                    【人工智能变现学院知识库】
                  </a>{" "}
                  <br />
                  <br />✅ 社群简介请点击▶{" "}
                  <a
                    href="https://ydyrb84oyc.feishu.cn/wiki/Vxg8wAFUti3VAhksSyLc4AD3n8g"
                    target="_blank"
                  >
                    【人工智能变现学院-AI🔥2.0 实验室】
                  </a>
                  <br />
                  <br />✅ 若需要 GPT-4 转发key▶{" "}
                  <a
                    href="https://ydyrb84oyc.feishu.cn/docx/XO3AdeWXZo5l8YxrGEHcLFo6n5p"
                    target="_blank"
                  >
                    💰套餐介绍：最低至1刀/1人民币，请求稳定
                  </a>
                  &nbsp;&nbsp;|&nbsp;&nbsp;
                  <a
                    href="https://www.jsbcp-2.top/微信交流群-个人.png"
                    target="_blank"
                  >
                    🌏 点我加微信 LHYYH0001 转账开通GPT4
                  </a>
                  <br />
                  <br />✅ 近期我在研究 AGI大模型全栈，可关注我个人知识库▶{" "}
                  <a href="https://www.yuque.com/lhyyh" target="_blank">
                    LLM，LangChain，NLP，Transformer、向量数据库、RAG、FineTune、各大模型API
                  </a>
                  <br />
                  <br />✅ 【2024 年 3 月 13 日】升级通知 ▶{" "}
                  本站已升级众多功能，且已支持 Gemini、Claude、Azure
                  等大模型。欢迎体验！
                </div>
              </Modal>
            </div>
          )}
        </div>

        <div>
          <IconButton
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : Locale.Home.NewChat}
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigate(Path.Chat);
              } else {
                navigate(Path.NewChat);
              }
            }}
            shadow
          />
        </div>
      </div>

      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>
    </div>
  );
}
