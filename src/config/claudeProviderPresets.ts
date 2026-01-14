/**
 * 预设供应商配置模板
 */
import { ProviderCategory } from "../types";

export interface TemplateValueConfig {
  label: string;
  placeholder: string;
  defaultValue?: string;
  editorValue: string;
}

/**
 * 预设供应商的视觉主题配置
 */
export interface PresetTheme {
  /** 图标类型：'claude' | 'codex' | 'gemini' | 'generic' */
  icon?: "claude" | "codex" | "gemini" | "generic";
  /** 背景色（选中状态），支持 Tailwind 类名或 hex 颜色 */
  backgroundColor?: string;
  /** 文字色（选中状态），支持 Tailwind 类名或 hex 颜色 */
  textColor?: string;
}

export interface ProviderPreset {
  name: string;
  websiteUrl: string;
  // 新增：第三方/聚合等可单独配置获取 API Key 的链接
  apiKeyUrl?: string;
  settingsConfig: object;
  isOfficial?: boolean; // 标识是否为官方预设
  isPartner?: boolean; // 标识是否为商业合作伙伴
  partnerPromotionKey?: string; // 合作伙伴促销信息的 i18n key
  category?: ProviderCategory; // 新增：分类
  // 新增：指定该预设所使用的 API Key 字段名（默认 ANTHROPIC_AUTH_TOKEN）
  apiKeyField?: "ANTHROPIC_AUTH_TOKEN" | "ANTHROPIC_API_KEY";
  // 新增：模板变量定义，用于动态替换配置中的值
  templateValues?: Record<string, TemplateValueConfig>; // editorValue 存储编辑器中的实时输入值
  // 新增：请求地址候选列表（用于地址管理/测速）
  endpointCandidates?: string[];
  // 新增：视觉主题配置
  theme?: PresetTheme;
  // 图标配置
  icon?: string; // 图标名称
  iconColor?: string; // 图标颜色
}

export const providerPresets: ProviderPreset[] = [
  {
    name: "⭐ HMCode",
    websiteUrl: "https://hongmacode.com",
    apiKeyUrl: "https://hongmacode.com",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://hongmacode.com/api",
        ANTHROPIC_AUTH_TOKEN: "",
      },
    },
    isPartner: true,
    partnerPromotionKey: "hmcode",
    category: "third_party",
    icon: "hmcode",
    iconColor: "#6B21A8",
  },
  {
    name: "Claude Official",
    websiteUrl: "https://www.anthropic.com/claude-code",
    settingsConfig: {
      env: {},
    },
    isOfficial: true,
    category: "official",
    theme: {
      icon: "claude",
      backgroundColor: "#D97757",
      textColor: "#FFFFFF",
    },
    icon: "anthropic",
    iconColor: "#D4915D",
  },
  {
    name: "DeepSeek",
    websiteUrl: "https://platform.deepseek.com",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "DeepSeek-V3.2",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "DeepSeek-V3.2",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "DeepSeek-V3.2",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "DeepSeek-V3.2",
      },
    },
    category: "cn_official",
    icon: "deepseek",
    iconColor: "#1E88E5",
  },
  {
    name: "Zhipu GLM",
    websiteUrl: "https://open.bigmodel.cn",
    apiKeyUrl: "https://www.bigmodel.cn/claude-code?ic=RRVJPB5SII",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://open.bigmodel.cn/api/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "glm-4.7",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-4.7",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-4.7",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "glm-4.7",
      },
    },
    category: "cn_official",
    isPartner: true,
    partnerPromotionKey: "zhipu",
    icon: "zhipu",
    iconColor: "#0F62FE",
  },
  {
    name: "Qwen Coder",
    websiteUrl: "https://bailian.console.aliyun.com",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://dashscope.aliyuncs.com/apps/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "qwen3-max",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3-max",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3-max",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3-max",
      },
    },
    category: "cn_official",
    icon: "qwen",
    iconColor: "#FF6A00",
  },
  {
    name: "Kimi k2",
    websiteUrl: "https://platform.moonshot.cn/console",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.moonshot.cn/anthropic",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kimi-k2-thinking",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-k2-thinking",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-k2-thinking",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-k2-thinking",
      },
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  {
    name: "Kimi For Coding",
    websiteUrl: "https://www.kimi.com/coding/docs/",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.kimi.com/coding/",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-for-coding",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-for-coding",
      },
    },
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
];
