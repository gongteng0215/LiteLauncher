export type ImagePromptProductId = "chatgpt-images-2";

export type ImagePromptStylePresetId =
  | "ecommerce-main"
  | "social-cover"
  | "movie-poster"
  | "portrait-photo"
  | "interior-architecture"
  | "illustration-ip"
  | "food-drink"
  | "education-poster"
  | "festival-campaign"
  | "birthday-party"
  | "app-saas"
  | "travel-landscape"
  | "beauty-fashion"
  | "livestream-commerce"
  | "brand-key-visual"
  | "packaging-design"
  | "home-decoration"
  | "automotive-transport"
  | "parent-child"
  | "medical-health"
  | "finance-business"
  | "recruitment-brand"
  | "public-service"
  | "guochao-culture"
  | "minimalist-print"
  | "retro-magazine";

export type ImagePromptStylePresetGroup =
  | "商品商业"
  | "内容封面"
  | "人像角色"
  | "空间建筑"
  | "餐饮生活"
  | "科技软件"
  | "活动节日"
  | "行业服务"
  | "艺术表现";

export type ImagePromptOptionGroupKey =
  | "subject"
  | "style"
  | "composition"
  | "lighting"
  | "materials"
  | "environment"
  | "mood"
  | "constraints";

export interface ImagePromptProductTemplate {
  id: ImagePromptProductId;
  label: string;
  description: string;
}

export type ImagePromptSmartTemplateId =
  | "ecommerce-main-image"
  | "brand-kv-launch"
  | "xiaohongshu-cover"
  | "short-video-cover"
  | "birthday-photo"
  | "child-first-birthday"
  | "food-magazine"
  | "saas-hero"
  | "movie-poster-drama"
  | "travel-campaign"
  | "medical-health-poster"
  | "finance-business-poster";

export interface ImagePromptSmartTemplatePatch {
  selections?: Partial<Record<ImagePromptOptionGroupKey, string[]>>;
  custom?: Partial<Record<Exclude<ImagePromptOptionGroupKey, "constraints">, string>>;
  text?: Partial<ImagePromptTextState>;
  photoDescription?: string;
  constraints?: string[];
}

export interface ImagePromptSmartTemplate {
  id: ImagePromptSmartTemplateId;
  label: string;
  description: string;
  stylePresetId: ImagePromptStylePresetId;
  patch: ImagePromptSmartTemplatePatch;
}

export interface ImagePromptOptionCategory {
  label: string;
  options: string[];
}

export interface ImagePromptOptionGroup {
  key: ImagePromptOptionGroupKey;
  label: string;
  description: string;
  options: string[];
  categories?: ImagePromptOptionCategory[];
  allowCustom: boolean;
}

export interface ImagePromptStylePreset {
  id: ImagePromptStylePresetId;
  group: ImagePromptStylePresetGroup;
  label: string;
  description: string;
  defaults: Partial<Record<ImagePromptOptionGroupKey, string[]>>;
  optionGroups: Partial<Record<ImagePromptOptionGroupKey, string[]>>;
  textDefaults?: Partial<ImagePromptTextState>;
}

export interface ImagePromptTextState {
  exact: string;
  position: string;
  style: string;
  designId: string;
  design: string;
  title: string;
  subtitle: string;
  label: string;
  name: string;
  age: string;
  layout: string;
  hierarchy: string;
  color: string;
  effect: string;
  safeArea: string;
  flags: string[];
}

export interface ImagePromptTextDesign {
  id: string;
  label: string;
  summary: string;
  typography: string;
  color: string;
  effect: string;
  layout: string;
  hierarchy: string;
  safeArea: string;
  keywords: string[];
}

export interface ImagePromptState {
  productId: ImagePromptProductId;
  stylePresetId: ImagePromptStylePresetId;
  photoDescription: string;
  selections: Record<ImagePromptOptionGroupKey, string[]>;
  custom: Record<Exclude<ImagePromptOptionGroupKey, "constraints">, string>;
  text: ImagePromptTextState;
  constraints: string[];
}

const PRODUCT_TEMPLATES: ImagePromptProductTemplate[] = [
  {
    id: "chatgpt-images-2",
    label: "ChatGPT Images 2.0",
    description: "自然语言商业提示词，适合明确文字、构图、产品质感和约束"
  }
];

const SUBJECT_CATEGORIES: ImagePromptOptionCategory[] = [
  {
    label: "商品 / 电商",
    options: [
      "一款无线蓝牙耳机悬浮在画面中央",
      "一款透明玻璃香水瓶",
      "一台极简风智能手表",
      "一双白色运动鞋",
      "一瓶护肤精华液",
      "一个金属机械键盘"
    ]
  },
  {
    label: "人物 / 肖像",
    options: [
      "一位年轻创业者坐在开放办公区",
      "一位咖啡师正在制作拉花",
      "一位运动员完成冲刺动作",
      "一位女性模特穿着极简通勤造型",
      "一家三口在客厅自然互动",
      "一位音乐人在舞台侧光中演奏"
    ]
  },
  {
    label: "空间 / 建筑",
    options: [
      "一间现代极简客厅",
      "一家精品咖啡店的窗边座位",
      "一处未来感科技展厅",
      "一间高端酒店大堂",
      "一栋玻璃幕墙办公楼入口",
      "一个温暖的家居厨房空间"
    ]
  },
  {
    label: "美食 / 餐饮",
    options: [
      "一杯冰美式咖啡",
      "一份摆盘精致的意面",
      "一块草莓奶油蛋糕",
      "一碗热气腾腾的拉面",
      "一份木盘上的早午餐",
      "一杯夏日水果气泡饮"
    ]
  },
  {
    label: "活动 / 品牌",
    options: [
      "品牌发布会舞台中央的大屏与灯光",
      "一场线下市集摊位活动",
      "一组新品发布海报主视觉",
      "一个节日促销主题场景",
      "一处企业年会签到区",
      "一场户外音乐节入口装置"
    ]
  },
  {
    label: "角色 / IP",
    options: [
      "原创卡通品牌吉祥物站在画面中央",
      "一名未来机甲战士角色",
      "一位奇幻魔法师角色",
      "一只拟人化咖啡杯角色",
      "一个赛博朋克风格头像角色",
      "一名可爱治愈系游戏 NPC"
    ]
  }
];

const STYLE_CATEGORIES: ImagePromptOptionCategory[] = [
  {
    label: "电商 / 商品",
    options: [
      "商业摄影风格",
      "淘宝主图风格",
      "高端电商主图风格",
      "科技产品海报风格",
      "奢侈品广告摄影风格",
      "真实棚拍摄影风格"
    ]
  },
  {
    label: "社媒 / 内容",
    options: [
      "小红书封面风格",
      "Instagram 产品海报风格",
      "社媒种草图风格",
      "生活方式摄影风格",
      "短视频封面风格",
      "播客封面风格"
    ]
  },
  {
    label: "海报 / 品牌",
    options: [
      "电影海报风格",
      "品牌活动主视觉风格",
      "音乐节海报风格",
      "极简杂志封面风格",
      "公益宣传海报风格",
      "展览视觉海报风格"
    ]
  },
  {
    label: "人物 / 摄影",
    options: [
      "时尚人像摄影风格",
      "纪实街拍摄影风格",
      "企业形象照风格",
      "电影感人物剧照风格",
      "复古胶片人像风格",
      "运动品牌大片风格"
    ]
  },
  {
    label: "空间 / 建筑",
    options: [
      "室内设计杂志摄影风格",
      "建筑摄影风格",
      "地产广告视觉风格",
      "酒店宣传片视觉风格",
      "展厅空间渲染风格",
      "城市旅行摄影风格"
    ]
  },
  {
    label: "插画 / 设计",
    options: [
      "3D 卡通渲染风格",
      "扁平矢量插画风格",
      "水彩插画风格",
      "像素艺术风格",
      "二次元海报风格",
      "高级品牌插画风格"
    ]
  }
];

function flattenOptionCategories(categories: ImagePromptOptionCategory[]): string[] {
  return categories.flatMap((category) => category.options);
}

const OPTION_GROUPS: ImagePromptOptionGroup[] = [
  {
    key: "subject",
    label: "主体",
    description: "画面主角和动作",
    allowCustom: true,
    options: flattenOptionCategories(SUBJECT_CATEGORIES),
    categories: SUBJECT_CATEGORIES
  },
  {
    key: "style",
    label: "风格",
    description: "具体媒介或成片风格",
    allowCustom: true,
    options: flattenOptionCategories(STYLE_CATEGORIES),
    categories: STYLE_CATEGORIES
  },
  {
    key: "composition",
    label: "构图 / 镜头",
    description: "比例、留白、视角和主体大小",
    allowCustom: true,
    options: [
      "居中构图",
      "产品占画面70%",
      "产品占画面60%",
      "顶部留白用于文字",
      "左侧留白用于文字",
      "右侧留白用于文字",
      "3:4比例",
      "4:5竖版",
      "1:1方图",
      "16:9横版",
      "轻微仰拍",
      "俯拍近景",
      "正面平视镜头",
      "浅景深特写"
    ]
  },
  {
    key: "lighting",
    label: "灯光",
    description: "质感和情绪的主要来源",
    allowCustom: true,
    options: [
      "柔光棚拍",
      "均匀阴影",
      "顶部大面积柔光",
      "侧逆光勾边",
      "黄金时刻暖光",
      "阴天漫射光",
      "冷色科技感灯光",
      "霓虹边缘光",
      "高对比硬光",
      "柔和自然窗光"
    ]
  },
  {
    key: "materials",
    label: "材质 / 细节",
    description: "材质、纹理、反光和微细节",
    allowCustom: true,
    options: [
      "磨砂塑料材质带细腻反光",
      "透明玻璃材质",
      "金属表面带精致高光",
      "陶瓷材质带柔和釉面",
      "皮革纹理清晰",
      "木纹细节自然",
      "织物纹理细腻",
      "水珠附着在表面",
      "边缘高光清晰",
      "微小颗粒质感可见"
    ]
  },
  {
    key: "environment",
    label: "环境",
    description: "背景和场景信息",
    allowCustom: true,
    options: [
      "白色渐变背景",
      "浅灰色无缝背景",
      "深色科技感背景",
      "柔和米色背景",
      "纯净电商棚拍背景",
      "模糊城市夜景背景",
      "窗边自然光场景",
      "高级工作室背景",
      "咖啡店窗边环境",
      "大理石台面背景"
    ]
  },
  {
    key: "mood",
    label: "氛围",
    description: "整体感受和行业气质",
    allowCustom: true,
    options: [
      "整体干净专业氛围",
      "高级质感",
      "科技感",
      "温暖松弛氛围",
      "奢华克制氛围",
      "清爽明亮氛围",
      "商业海报质感",
      "未来感",
      "安静极简氛围",
      "年轻潮流氛围"
    ]
  },
  {
    key: "constraints",
    label: "约束条件",
    description: "限制模型不要乱加内容",
    allowCustom: false,
    options: [
      "无水印",
      "无logo",
      "无额外文字",
      "不要变形",
      "不要多余产品",
      "不要人物",
      "背景干净",
      "保持产品完整",
      "不要裁切主体",
      "不要低清晰度",
      "不要杂乱元素",
      "只出现一个主体"
    ]
  }
];

const TEXT_POSITIONS = [
  "顶部居中",
  "顶部左侧",
  "顶部右侧",
  "底部居中",
  "左侧居中",
  "右侧居中"
];

const TEXT_STYLES = [
  "无衬线加粗",
  "极简无衬线",
  "现代黑体",
  "细字重无衬线",
  "杂志标题风格",
  "高端品牌字标风格"
];

const TEXT_DESIGNS: ImagePromptTextDesign[] = [
  {
    id: "ecommerce-benefit",
    label: "电商卖点标题设计",
    summary: "顶部留白区的大卖点标题，干净、高对比、不遮挡产品",
    typography: "大号粗体无衬线，字面干净，适合商品主图",
    color: "黑色或深灰高对比，也可按背景改为白色",
    effect: "轻微投影或无效果，避免廉价描边",
    layout: "主标题贴合顶部留白区，不遮挡产品，和产品保持明确安全距离",
    hierarchy: "主标题为唯一大标题，不添加副标题和小字干扰",
    safeArea: "不遮挡产品轮廓、卖点材质和反光边缘",
    keywords: ["主图", "卖点", "顶部留白", "不挡产品"]
  },
  {
    id: "brand-kv",
    label: "品牌主视觉标题设计",
    summary: "克制高端 KV 字标，和主体形成统一品牌版式",
    typography: "高端品牌字标，克制字距，字重稳定",
    color: "品牌主色或黑白高对比色",
    effect: "少量细腻光泽或无效果",
    layout: "放在品牌标语区域，与主体和辅助图形对齐",
    hierarchy: "主标题突出，副标题可小一到两级",
    safeArea: "不破坏主体识别度，品牌元素保持秩序",
    keywords: ["KV", "品牌", "克制", "高级"]
  },
  {
    id: "social-cover",
    label: "小红书封面标题设计",
    summary: "手机端一眼可读的圆润封面标题",
    typography: "圆润现代黑体，字重偏粗，适合手机端阅读",
    color: "白色、黑色或高饱和点缀色，和背景形成强对比",
    effect: "可用轻微描边或半透明底托增强可读性",
    layout: "放在封面标题区，和人物或商品保持安全距离",
    hierarchy: "主标题醒目，标签可作为小贴纸出现",
    safeArea: "不遮挡人物面部、手部和核心商品",
    keywords: ["封面", "手机端", "醒目", "不挡脸"]
  },
  {
    id: "short-video-bold",
    label: "短视频封面强标题设计",
    summary: "大号强对比标题，适合快速扫屏",
    typography: "大号粗体无衬线，字形有力量",
    color: "白字黑边、黄黑撞色或品牌促销色",
    effect: "强对比描边、投影或半透明底托",
    layout: "贴近顶部或视觉焦点旁，避免压住主播和商品",
    hierarchy: "主标题最大，价格或动作词可做小标签",
    safeArea: "不遮挡人脸、商品和关键手势",
    keywords: ["短视频", "强标题", "描边", "转化"]
  },
  {
    id: "birthday-soft",
    label: "温柔生日标题设计",
    summary: "给人过生日的温柔标题，适合照片海报",
    typography: "圆润可爱字体，亲和但不幼稚",
    color: "奶油白、浅金或粉色，和派对背景柔和搭配",
    effect: "轻微柔和投影或浅金描边，保证可读",
    layout: "标题融入气球、蛋糕、彩带装饰，像派对布置的一部分",
    hierarchy: "年龄为主视觉标题，祝福语和姓名较小",
    safeArea: "不遮挡照片人物、面部、五官和发型",
    keywords: ["生日", "照片", "不挡脸", "浅金", "气球"]
  },
  {
    id: "baby-first-birthday",
    label: "宝宝周岁标题设计",
    summary: "童趣圆体周岁标题，柔和可爱",
    typography: "童趣圆体，字形饱满可爱",
    color: "柔和粉白、浅金或糖果色描边",
    effect: "轻微描边、贴纸感或柔和投影",
    layout: "标题像派对装饰的一部分，靠近气球或蛋糕但不压照片",
    hierarchy: "周岁年龄最醒目，祝福语做小字",
    safeArea: "不遮挡宝宝照片、脸部和手部",
    keywords: ["宝宝", "周岁", "童趣", "不挡脸"]
  },
  {
    id: "food-editorial",
    label: "美食杂志标题设计",
    summary: "杂志封面式排版，和餐具留白对齐",
    typography: "优雅衬线或细字重无衬线",
    color: "深咖、奶油白或食材呼应色",
    effect: "少量阴影或无效果，保持杂志质感",
    layout: "对齐餐具、桌面或留白边界",
    hierarchy: "主标题像栏目名，副标题可做小号说明",
    safeArea: "不遮挡食物主体、摆盘和食材纹理",
    keywords: ["美食", "杂志", "衬线", "留白"]
  },
  {
    id: "saas-tech",
    label: "SaaS 科技标题设计",
    summary: "和 UI 卡片网格对齐的科技标题",
    typography: "现代无衬线，字重中高，几何感清晰",
    color: "冷色高对比，白色、浅蓝或品牌科技色",
    effect: "轻微外发光或玻璃拟态底托",
    layout: "和 UI 卡片、设备边缘或数据网格对齐",
    hierarchy: "主标题突出，副标题可像产品说明",
    safeArea: "不遮挡设备屏幕和 UI 关键信息",
    keywords: ["SaaS", "科技", "网格", "UI"]
  },
  {
    id: "movie-title",
    label: "电影海报片名设计",
    summary: "片名融入光影层级，形成海报感",
    typography: "电影片名字体，强标题感",
    color: "按海报光影选择白色、红色或冷色高对比",
    effect: "融入烟雾、雨夜、霓虹或阴影",
    layout: "片名与人物和环境光影同层，不像后贴字幕",
    hierarchy: "片名最大，演职员信息区域保留",
    safeArea: "不遮挡人物眼睛、脸部和关键动作",
    keywords: ["电影", "片名", "光影", "海报"]
  },
  {
    id: "travel-premium",
    label: "旅行宣传标题设计",
    summary: "天空留白里的高端度假标题",
    typography: "高端度假海报标题，轻盈字距",
    color: "白色、沙金或深色高对比",
    effect: "少量柔和阴影保证天空中可读",
    layout: "自然排在天空、海面或大面积留白内",
    hierarchy: "目的地标题为主，宣传语较小",
    safeArea: "不遮挡地平线、建筑和景观主体",
    keywords: ["旅行", "天空留白", "度假", "高级"]
  },
  {
    id: "medical-clean",
    label: "医疗健康标题设计",
    summary: "可信赖的蓝白清爽标题",
    typography: "蓝白清爽现代黑体，可信赖，不花哨",
    color: "蓝白、深蓝或医疗品牌色",
    effect: "无效果或极轻微投影",
    layout: "放在信息区或图标旁，保持诊疗画面专业",
    hierarchy: "主标题清晰，科普信息可做小字",
    safeArea: "避开医生、患者、设备屏幕和医疗器械",
    keywords: ["医疗", "可信", "清爽", "专业"]
  },
  {
    id: "finance-corporate",
    label: "金融商务标题设计",
    summary: "克制稳重的企业级标题",
    typography: "克制高级字形，字距稳定，商务感强",
    color: "稳重深色或浅色高对比，可带金色点缀",
    effect: "少量金属质感或无效果",
    layout: "和数据区域、人物视线或深色留白保持秩序",
    hierarchy: "主标题稳重，副标题像企业服务说明",
    safeArea: "不遮挡数据图表、人物脸部和界面信息",
    keywords: ["金融", "商务", "稳重", "数据"]
  },
  {
    id: "portrait-elegant",
    label: "人像写真标题设计",
    summary: "低调优雅，不压住面部情绪",
    typography: "细字重无衬线或优雅衬线",
    color: "黑白或低饱和高级色",
    effect: "无效果或轻微阴影",
    layout: "放在留白区，配合人像视线方向",
    hierarchy: "标题小而精致，保留大片画面呼吸感",
    safeArea: "不压住面部表情、眼睛和发型",
    keywords: ["人像", "优雅", "留白", "不挡脸"]
  },
  {
    id: "interior-grid",
    label: "室内建筑标题设计",
    summary: "沿建筑线条排版的极简标题",
    typography: "极简无衬线，字形干净",
    color: "黑白灰或空间主色",
    effect: "无效果，保持空间真实",
    layout: "沿建筑网格、墙面或窗线对齐",
    hierarchy: "标题克制，不抢空间主体",
    safeArea: "不破坏建筑线条和透视关系",
    keywords: ["室内", "建筑", "网格", "极简"]
  },
  {
    id: "illustration-sticker",
    label: "插画 IP 标题设计",
    summary: "像贴纸一样融入角色世界",
    typography: "圆润活泼字形，适合 IP 角色",
    color: "呼应角色主色或互补色",
    effect: "贴纸描边、轻微投影或手绘边",
    layout: "围绕角色或道具，自然嵌入插画",
    hierarchy: "标题活泼，标签可做小贴纸",
    safeArea: "不遮挡角色脸部和识别特征",
    keywords: ["插画", "IP", "贴纸", "角色"]
  },
  {
    id: "education-clear",
    label: "教育知识标题设计",
    summary: "层级清楚的知识类标题",
    typography: "清晰黑体，信息层级明确",
    color: "深色文字配浅底，或品牌教育色",
    effect: "少量底托或无效果",
    layout: "和知识卡片、图标或课堂场景对齐",
    hierarchy: "主标题清晰，小标签可辅助分类",
    safeArea: "不遮挡图表、人物和教学内容",
    keywords: ["教育", "知识", "清晰", "层级"]
  },
  {
    id: "festival-promo",
    label: "节日活动标题设计",
    summary: "喜庆醒目但不杂乱的活动标题",
    typography: "喜庆醒目字形，适合活动主视觉",
    color: "金色、红色或活动品牌色",
    effect: "金色高光、轻微描边或彩带点缀",
    layout: "和礼盒、彩带、活动元素形成主视觉",
    hierarchy: "主活动标题最大，优惠信息单独分区",
    safeArea: "促销元素不挤压主体和标题",
    keywords: ["节日", "活动", "促销", "金色"]
  },
  {
    id: "packaging-minimal",
    label: "包装提案标题设计",
    summary: "不破坏包装细节的极简标题",
    typography: "极简品牌标题，字距克制",
    color: "包装主色或黑白高对比",
    effect: "无效果或极轻微投影",
    layout: "和包装正面、展示台或画面边界对齐",
    hierarchy: "标题小而清楚，包装仍是主角",
    safeArea: "不遮挡包装文字、标签和烫金细节",
    keywords: ["包装", "提案", "极简", "不挡包装"]
  },
  {
    id: "home-warm",
    label: "家居生活标题设计",
    summary: "温和低饱和的生活方式标题",
    typography: "温和现代字体，字形亲和",
    color: "低饱和暖色、米白或深灰",
    effect: "无效果或轻微柔和阴影",
    layout: "放在墙面、窗边或生活留白中",
    hierarchy: "标题轻松，副标题像生活说明",
    safeArea: "不遮挡家具比例、空间线条和人物互动",
    keywords: ["家居", "温暖", "低饱和", "生活"]
  },
  {
    id: "auto-speed",
    label: "汽车速度标题设计",
    summary: "沿车身动线排版的锐利标题",
    typography: "锐利现代字形，速度感强",
    color: "白色、银色、红色或冷色科技光",
    effect: "轻微运动模糊、金属光泽或霓虹边缘",
    layout: "沿车身动线、道路方向或速度轨迹排版",
    hierarchy: "车型标题大，卖点小字靠边",
    safeArea: "不遮挡车标、车灯、车身轮廓和轮胎",
    keywords: ["汽车", "速度", "动线", "锐利"]
  },
  {
    id: "family-soft",
    label: "亲子生活标题设计",
    summary: "柔和亲和的家庭标签式标题",
    typography: "圆润亲和字体，字形柔软",
    color: "柔和暖色、奶油白或浅棕",
    effect: "轻微贴纸底托或柔和投影",
    layout: "像温馨标签放在生活留白处",
    hierarchy: "标题亲和，副标题可像手写备注",
    safeArea: "不遮挡人物互动、儿童脸部和产品",
    keywords: ["亲子", "家庭", "温馨", "不挡脸"]
  },
  {
    id: "public-clear",
    label: "公益宣传标题设计",
    summary: "清晰有力的公益海报标题",
    typography: "清晰有力标题，字形正直",
    color: "主题色高对比，避免花哨",
    effect: "无效果或轻微阴影",
    layout: "和主题象征物形成公益海报层级",
    hierarchy: "主倡议清晰，说明文字在下方",
    safeArea: "不遮挡人物表情和象征物",
    keywords: ["公益", "倡议", "清晰", "有力"]
  },
  {
    id: "guochao-gold",
    label: "国潮文创标题设计",
    summary: "现代中式字形配少量烫金",
    typography: "现代中式字形，笔画有文化感",
    color: "朱红、墨色、米白或少量烫金",
    effect: "烫金、印章感或轻微纸纹融合",
    layout: "和传统纹样、山水层次保持秩序",
    hierarchy: "标题有仪式感，小印章可做标签",
    safeArea: "不遮挡产品和传统纹样细节",
    keywords: ["国潮", "中式", "烫金", "文创"]
  },
  {
    id: "print-grid",
    label: "极简印刷标题设计",
    summary: "网格系统里的克制印刷标题",
    typography: "细字重或中等字重，字面干净",
    color: "黑白灰或单一强调色",
    effect: "无效果，像真实印刷物料",
    layout: "严格按网格系统和留白排版",
    hierarchy: "标题克制，留白是视觉重点",
    safeArea: "不破坏纸张边界和印刷质感",
    keywords: ["印刷", "网格", "极简", "留白"]
  },
  {
    id: "retro-editorial",
    label: "复古杂志标题设计",
    summary: "复古刊头式排版，像真实封面",
    typography: "复古杂志刊头字体，字形有年代感",
    color: "胶片色、米白、暗红或复古蓝",
    effect: "轻微印刷颗粒或旧纸质感",
    layout: "像封面标题排在顶部或边缘留白",
    hierarchy: "刊头最大，栏目小字环绕",
    safeArea: "不遮挡人物脸部和复古主体",
    keywords: ["复古", "杂志", "刊头", "胶片"]
  }
];

const DEFAULT_TEXT_DESIGN = TEXT_DESIGNS[0];

function cloneTextDesign(design: ImagePromptTextDesign): ImagePromptTextDesign {
  return {
    ...design,
    keywords: [...design.keywords]
  };
}

function findTextDesign(idOrLabel: string | undefined): ImagePromptTextDesign {
  return (
    TEXT_DESIGNS.find((design) => design.id === idOrLabel || design.label === idOrLabel) ??
    DEFAULT_TEXT_DESIGN
  );
}

function createTextState(defaults: Partial<ImagePromptTextState> = {}): ImagePromptTextState {
  const textDesign = findTextDesign(defaults.designId ?? defaults.design);
  return {
    exact: defaults.exact ?? "",
    position: defaults.position ?? "顶部居中",
    style: defaults.style ?? "无衬线加粗",
    designId: defaults.designId ?? textDesign.id,
    design: defaults.design ?? textDesign.label,
    title: defaults.title ?? "",
    subtitle: defaults.subtitle ?? "",
    label: defaults.label ?? "",
    name: defaults.name ?? "",
    age: defaults.age ?? "",
    layout: defaults.layout ?? textDesign.layout,
    hierarchy: defaults.hierarchy ?? textDesign.hierarchy,
    color: defaults.color ?? textDesign.color,
    effect: defaults.effect ?? textDesign.effect,
    safeArea: defaults.safeArea ?? textDesign.safeArea,
    flags: [...(defaults.flags ?? ["高对比", "仅出现一次"])]
  };
}

const TEXT_DESIGN_BY_STYLE_PRESET: Partial<Record<ImagePromptStylePresetId, ImagePromptTextDesign>> = {
  "ecommerce-main": TEXT_DESIGNS[0],
  "brand-key-visual": TEXT_DESIGNS[1],
  "social-cover": TEXT_DESIGNS[2],
  "livestream-commerce": TEXT_DESIGNS[3],
  "birthday-party": TEXT_DESIGNS[4],
  "food-drink": TEXT_DESIGNS[6],
  "app-saas": TEXT_DESIGNS[7],
  "movie-poster": TEXT_DESIGNS[8],
  "travel-landscape": TEXT_DESIGNS[9],
  "medical-health": TEXT_DESIGNS[10],
  "finance-business": TEXT_DESIGNS[11],
  "portrait-photo": TEXT_DESIGNS[12],
  "interior-architecture": TEXT_DESIGNS[13],
  "illustration-ip": TEXT_DESIGNS[14],
  "education-poster": TEXT_DESIGNS[15],
  "festival-campaign": TEXT_DESIGNS[16],
  "packaging-design": TEXT_DESIGNS[17],
  "home-decoration": TEXT_DESIGNS[18],
  "automotive-transport": TEXT_DESIGNS[19],
  "parent-child": TEXT_DESIGNS[20],
  "public-service": TEXT_DESIGNS[21],
  "guochao-culture": TEXT_DESIGNS[22],
  "minimalist-print": TEXT_DESIGNS[23],
  "retro-magazine": TEXT_DESIGNS[24],
  "beauty-fashion": TEXT_DESIGNS[1],
  "recruitment-brand": TEXT_DESIGNS[15]
};

const TEXT_RECOMMENDATION_BY_STYLE_PRESET: Partial<
  Record<ImagePromptStylePresetId, Pick<ImagePromptTextState, "position" | "style">>
> = {
  "ecommerce-main": { position: "顶部居中", style: "无衬线加粗" },
  "brand-key-visual": { position: "顶部居中", style: "高端品牌字标风格" },
  "social-cover": { position: "顶部居中", style: "现代黑体" },
  "livestream-commerce": { position: "顶部居中", style: "无衬线加粗" },
  "birthday-party": { position: "顶部居中", style: "无衬线加粗" },
  "food-drink": { position: "顶部右侧", style: "杂志标题风格" },
  "app-saas": { position: "顶部左侧", style: "现代黑体" },
  "movie-poster": { position: "底部居中", style: "杂志标题风格" },
  "travel-landscape": { position: "顶部居中", style: "高端品牌字标风格" },
  "medical-health": { position: "顶部右侧", style: "现代黑体" },
  "finance-business": { position: "顶部左侧", style: "高端品牌字标风格" },
  "portrait-photo": { position: "底部居中", style: "细字重无衬线" },
  "interior-architecture": { position: "顶部左侧", style: "极简无衬线" },
  "illustration-ip": { position: "顶部居中", style: "现代黑体" },
  "education-poster": { position: "顶部左侧", style: "现代黑体" },
  "festival-campaign": { position: "顶部居中", style: "无衬线加粗" },
  "packaging-design": { position: "顶部左侧", style: "极简无衬线" },
  "home-decoration": { position: "顶部左侧", style: "极简无衬线" },
  "automotive-transport": { position: "顶部右侧", style: "现代黑体" },
  "parent-child": { position: "顶部居中", style: "现代黑体" },
  "public-service": { position: "顶部居中", style: "现代黑体" },
  "guochao-culture": { position: "顶部居中", style: "高端品牌字标风格" },
  "minimalist-print": { position: "顶部左侧", style: "极简无衬线" },
  "retro-magazine": { position: "顶部居中", style: "杂志标题风格" },
  "beauty-fashion": { position: "顶部居中", style: "高端品牌字标风格" },
  "recruitment-brand": { position: "顶部左侧", style: "现代黑体" }
};

const TEXT_FLAGS = ["高对比", "仅出现一次", "文字清晰可读", "不要错字"];

const STYLE_PRESETS: ImagePromptStylePreset[] = [
  {
    id: "ecommerce-main",
    group: "商品商业",
    label: "电商主图",
    description: "商品居中、卖点清晰、适合淘宝/电商主图",
    defaults: {
      subject: ["一款无线蓝牙耳机悬浮在画面中央"],
      style: ["淘宝主图风格"],
      composition: ["居中构图", "产品占画面70%", "顶部留白用于文字", "3:4比例"],
      lighting: ["柔光棚拍", "均匀阴影"],
      materials: ["磨砂塑料材质带细腻反光"],
      environment: ["白色渐变背景"],
      mood: ["高级质感", "整体干净专业氛围"],
      constraints: []
    },
    optionGroups: {
      subject: [
        "一款无线蓝牙耳机悬浮在画面中央",
        "一款透明玻璃香水瓶",
        "一台极简风智能手表",
        "一双白色运动鞋",
        "一瓶护肤精华液",
        "一个金属机械键盘"
      ],
      style: [
        "淘宝主图风格",
        "商业摄影风格",
        "高端电商主图风格",
        "科技产品海报风格",
        "奢侈品广告摄影风格"
      ],
      composition: ["居中构图", "产品占画面70%", "产品占画面60%", "顶部留白用于文字", "3:4比例", "1:1方图"],
      lighting: ["柔光棚拍", "均匀阴影", "顶部大面积柔光", "侧逆光勾边", "高对比硬光"],
      materials: ["磨砂塑料材质带细腻反光", "透明玻璃材质", "金属表面带精致高光", "陶瓷材质带柔和釉面", "边缘高光清晰"],
      environment: ["白色渐变背景", "浅灰色无缝背景", "纯净电商棚拍背景", "深色科技感背景"],
      mood: ["高级质感", "整体干净专业氛围", "科技感", "奢华克制氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "不要多余产品", "保持产品完整", "不要裁切主体"]
    }
  },
  {
    id: "social-cover",
    group: "内容封面",
    label: "社媒封面",
    description: "适合小红书、短视频封面和生活方式内容",
    defaults: {
      subject: ["一位生活方式博主坐在咖啡店窗边"],
      style: ["小红书封面风格"],
      composition: ["封面上方保留标题区", "人物位于画面下半部分", "4:5竖版"],
      lighting: ["柔和自然窗光"],
      materials: ["织物纹理细腻"],
      environment: ["咖啡店窗边环境"],
      mood: ["温暖松弛氛围", "年轻潮流氛围"],
      constraints: []
    },
    optionGroups: {
      subject: [
        "一位生活方式博主坐在咖啡店窗边",
        "一位探店博主手持饮品看向镜头",
        "一位穿搭博主站在街角",
        "一组桌面好物围绕笔记本摆放",
        "一份木盘上的早午餐",
        "一杯夏日水果气泡饮"
      ],
      style: ["小红书封面风格", "社媒种草图风格", "生活方式摄影风格", "短视频封面风格", "Instagram 产品海报风格"],
      composition: ["封面上方保留标题区", "人物位于画面下半部分", "左侧留白用于文字", "4:5竖版", "近景生活化构图"],
      lighting: ["柔和自然窗光", "黄金时刻暖光", "阴天漫射光", "轻微阴影"],
      materials: ["织物纹理细腻", "木纹细节自然", "纸张纤维细节清晰", "水珠附着在表面"],
      environment: ["咖啡店窗边环境", "窗边自然光场景", "模糊城市街景背景", "温暖家居背景"],
      mood: ["温暖松弛氛围", "年轻潮流氛围", "清爽明亮氛围", "商业海报质感"],
      constraints: ["无水印", "无logo", "无额外文字", "人物表情自然", "文字区域干净"]
    }
  },
  {
    id: "movie-poster",
    group: "艺术表现",
    label: "电影海报",
    description: "主角、戏剧光影和强叙事画面",
    defaults: {
      subject: ["主角站在雨夜街道中央"],
      style: ["电影海报风格"],
      composition: ["主角居中构图", "底部保留演员信息区域", "2:3竖版"],
      lighting: ["高对比硬光", "霓虹边缘光"],
      materials: ["雨滴和湿润地面反光清晰"],
      environment: ["模糊城市夜景背景"],
      mood: ["悬疑紧张氛围", "电影感强烈"],
      constraints: []
    },
    optionGroups: {
      subject: ["主角站在雨夜街道中央", "两位主角背对背站立", "一位侦探站在昏暗房间门口", "一名未来机甲战士角色", "一位奇幻魔法师角色"],
      style: ["电影海报风格", "电影感人物剧照风格", "复古胶片人像风格", "赛博朋克电影视觉风格"],
      composition: ["主角居中构图", "低角度仰拍", "底部保留演员信息区域", "2:3竖版", "强烈前后景层次"],
      lighting: ["高对比硬光", "霓虹边缘光", "侧逆光勾边", "冷暖对比光"],
      materials: ["雨滴和湿润地面反光清晰", "皮革纹理清晰", "金属表面带精致高光", "烟雾层次可见"],
      environment: ["模糊城市夜景背景", "深色科技感背景", "昏暗室内走廊", "荒芜户外场景"],
      mood: ["悬疑紧张氛围", "电影感强烈", "未来感", "史诗感"],
      constraints: ["无水印", "无logo", "无额外文字", "不要错字", "人物不要变形"]
    }
  },
  {
    id: "portrait-photo",
    group: "人像角色",
    label: "人像摄影",
    description: "人物气质、表情、服装和专业光线",
    defaults: {
      subject: ["一位女性模特穿着极简通勤造型"],
      style: ["时尚人像摄影风格"],
      composition: ["半身近景", "视线看向镜头", "4:5竖版"],
      lighting: ["柔和自然窗光", "侧逆光勾边"],
      materials: ["织物纹理细腻"],
      environment: ["高级工作室背景"],
      mood: ["高级质感", "安静极简氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一位女性模特穿着极简通勤造型", "一位年轻创业者坐在开放办公区", "一位运动员完成冲刺动作", "一位音乐人在舞台侧光中演奏", "一家三口在客厅自然互动"],
      style: ["时尚人像摄影风格", "纪实街拍摄影风格", "企业形象照风格", "运动品牌大片风格", "复古胶片人像风格"],
      composition: ["半身近景", "视线看向镜头", "三分法构图", "背景浅景深", "4:5竖版"],
      lighting: ["柔和自然窗光", "侧逆光勾边", "阴天漫射光", "高对比硬光"],
      materials: ["织物纹理细腻", "皮革纹理清晰", "发丝细节清晰", "妆容细节自然"],
      environment: ["高级工作室背景", "开放办公区背景", "城市街角背景", "舞台暗背景"],
      mood: ["高级质感", "安静极简氛围", "年轻潮流氛围", "商业海报质感"],
      constraints: ["无水印", "无logo", "无额外文字", "人物表情自然", "手部不要变形"]
    }
  },
  {
    id: "interior-architecture",
    group: "空间建筑",
    label: "空间建筑",
    description: "室内、建筑、酒店和展厅空间视觉",
    defaults: {
      subject: ["一间现代极简客厅"],
      style: ["室内设计杂志摄影风格"],
      composition: ["广角平视构图", "空间纵深清晰", "16:9横版"],
      lighting: ["柔和自然窗光"],
      materials: ["木纹细节自然", "织物纹理细腻"],
      environment: ["窗边自然光场景"],
      mood: ["安静极简氛围", "高级质感"],
      constraints: []
    },
    optionGroups: {
      subject: ["一间现代极简客厅", "一家精品咖啡店的窗边座位", "一处未来感科技展厅", "一间高端酒店大堂", "一栋玻璃幕墙办公楼入口"],
      style: ["室内设计杂志摄影风格", "建筑摄影风格", "地产广告视觉风格", "酒店宣传片视觉风格", "展厅空间渲染风格"],
      composition: ["广角平视构图", "空间纵深清晰", "对称构图", "16:9横版", "垂直线条保持笔直"],
      lighting: ["柔和自然窗光", "阴天漫射光", "顶部大面积柔光", "黄金时刻暖光"],
      materials: ["木纹细节自然", "大理石纹理清晰", "金属表面带精致高光", "织物纹理细腻", "玻璃反射自然"],
      environment: ["窗边自然光场景", "高级工作室背景", "大理石台面背景", "城市天际线背景"],
      mood: ["安静极简氛围", "高级质感", "温暖松弛氛围", "未来感"],
      constraints: ["无水印", "无logo", "无额外文字", "空间不要变形", "垂直线条保持笔直"]
    }
  },
  {
    id: "illustration-ip",
    group: "人像角色",
    label: "插画角色",
    description: "IP 角色、吉祥物、游戏角色和插画视觉",
    defaults: {
      subject: ["原创卡通品牌吉祥物站在画面中央"],
      style: ["3D 卡通渲染风格"],
      composition: ["角色居中构图", "角色占画面65%", "1:1方图"],
      lighting: ["柔和棚拍光"],
      materials: ["圆润塑胶质感"],
      environment: ["纯色渐变背景"],
      mood: ["可爱治愈氛围", "年轻潮流氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["原创卡通品牌吉祥物站在画面中央", "一名未来机甲战士角色", "一位奇幻魔法师角色", "一只拟人化咖啡杯角色", "一个赛博朋克风格头像角色", "一名可爱治愈系游戏 NPC"],
      style: ["3D 卡通渲染风格", "扁平矢量插画风格", "水彩插画风格", "像素艺术风格", "二次元海报风格", "高级品牌插画风格"],
      composition: ["角色居中构图", "角色占画面65%", "1:1方图", "半身头像构图", "动作姿态清晰"],
      lighting: ["柔和棚拍光", "顶部大面积柔光", "霓虹边缘光", "冷色科技感灯光"],
      materials: ["圆润塑胶质感", "软陶材质质感", "金属装甲高光清晰", "布料褶皱简化"],
      environment: ["纯色渐变背景", "深色科技感背景", "魔法森林背景", "游戏主城背景"],
      mood: ["可爱治愈氛围", "年轻潮流氛围", "未来感", "奇幻冒险氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "角色不要变形", "保持角色完整"]
    }
  }
];

const STYLE_PRESET_OPTION_FALLBACKS: Record<ImagePromptOptionGroupKey, string[]> = {
  subject: [
    "一个清晰的主角主体",
    "一组围绕主题排列的核心元素",
    "一个正在发生动作的核心角色",
    "一个可延展的主视觉场景",
    "一个具有明确用途的画面主角",
    "一组品牌视觉元素",
    "一个居中展示的产品组合",
    "一位正在使用产品的真实用户",
    "一个可直接用于封面的核心场景",
    "一组有层次的前景主体和辅助元素",
    "一个行业特征明确的商业场景",
    "一个适合海报主视觉的标志性物件"
  ],
  style: [
    "商业海报风格",
    "品牌视觉主视觉风格",
    "杂志封面风格",
    "精致广告视觉风格",
    "高端内容封面风格",
    "现代设计海报风格",
    "真实商业摄影风格",
    "社交媒体封面风格",
    "高端品牌广告风格",
    "编辑部视觉大片风格",
    "信息清晰的运营海报风格",
    "精致平面设计风格"
  ],
  composition: [
    "居中构图",
    "三分法构图",
    "顶部留白用于文字",
    "主体占画面60%",
    "4:5竖版",
    "1:1方图",
    "16:9横版",
    "主体与文字区左右分栏",
    "前景中景背景层次分明",
    "对角线动势构图",
    "低角度仰拍增强气势",
    "俯拍平铺构图",
    "浅景深突出主体",
    "85mm 人像镜头视角",
    "35mm 环境纪实镜头视角",
    "微距特写镜头",
    "广角远景镜头",
    "移动端封面安全构图",
    "顶部标题安全区清晰",
    "画面边缘保留呼吸感"
  ],
  lighting: [
    "柔和自然光",
    "柔光棚拍",
    "侧逆光勾边",
    "高对比硬光",
    "黄金时刻暖光",
    "阴天漫射光",
    "顶部大面积柔光",
    "干净无重影灯光",
    "冷色科技感灯光",
    "暖色环境氛围光",
    "屏幕微光照亮主体",
    "局部聚光突出主体",
    "电影级轮廓光",
    "柔和窗光",
    "高端棚拍柔光箱",
    "HDR 高动态范围光线",
    "低调暗背景布光",
    "漫反射柔光降低硬阴影"
  ],
  materials: [
    "材质纹理清晰",
    "边缘高光清晰",
    "微小颗粒质感可见",
    "表面细节自然",
    "反光控制干净",
    "层次细节丰富",
    "金属高光精致",
    "玻璃反射自然",
    "纸张纤维可见",
    "织物纹理细腻",
    "塑料边缘干净",
    "液体质感通透",
    "高分辨率细节清晰",
    "皮肤质感自然不过度磨皮",
    "透明材质折射真实",
    "包装印刷边缘锐利",
    "布料褶皱自然可信",
    "细节不过度锐化"
  ],
  environment: [
    "干净渐变背景",
    "模糊场景背景",
    "高级工作室背景",
    "自然生活场景",
    "品牌色背景",
    "空间层次清晰",
    "纯净白色背景",
    "浅灰无缝背景",
    "城市街景虚化背景",
    "室内窗边自然光背景",
    "行业场景信息清晰",
    "低干扰商业背景",
    "背景元素支持行业信息但保持简洁",
    "前景层次轻微虚化",
    "真实可商用场景",
    "品牌色弱化融入背景",
    "画面留白区域干净",
    "背景不抢主体"
  ],
  mood: [
    "整体干净专业氛围",
    "高级质感",
    "温暖松弛氛围",
    "清爽明亮氛围",
    "年轻潮流氛围",
    "商业海报质感",
    "可信专业氛围",
    "科技智能氛围",
    "精致生活感",
    "强烈视觉冲击",
    "克制高级氛围",
    "轻松亲和氛围",
    "强转化促销感",
    "温暖纪念感",
    "电影级张力",
    "低调奢华感",
    "清晰可信的服务感",
    "适合商业投放的完成度"
  ],
  constraints: [
    "无水印",
    "无logo",
    "无额外文字",
    "不要变形",
    "主体清晰完整",
    "文字区域干净",
    "不要低清晰度",
    "不要杂乱元素",
    "不要裁切主体",
    "不要多余主体",
    "文字不要错字",
    "保持比例自然",
    "不要错误拼写",
    "不要畸形手指",
    "不要遮挡人物面部",
    "不要过度锐化",
    "不要虚假品牌logo",
    "不要出现不可读乱码"
  ]
};

const ADDITIONAL_STYLE_PRESETS: ImagePromptStylePreset[] = [
  {
    id: "food-drink",
    group: "餐饮生活",
    label: "美食饮品",
    description: "餐饮、咖啡、甜品和菜单主视觉",
    defaults: {
      subject: ["一杯冰美式咖啡放在木纹桌面上"],
      style: ["高级餐饮摄影风格"],
      composition: ["俯拍近景", "右上角保留文字留白", "4:5竖版"],
      lighting: ["柔和自然窗光", "轻微阴影"],
      materials: ["水珠附着在杯壁", "木纹细节自然"],
      environment: ["咖啡店窗边环境"],
      mood: ["温暖松弛氛围", "食欲感强"],
      constraints: []
    },
    optionGroups: {
      subject: ["一杯冰美式咖啡放在木纹桌面上", "一块草莓奶油蛋糕", "一碗热气腾腾的拉面", "一份摆盘精致的意面", "一杯夏日水果气泡饮", "一份木盘上的早午餐", "一盒手工巧克力", "一份节日限定甜品礼盒"],
      style: ["高级餐饮摄影风格", "咖啡店海报风格", "菜单主视觉风格", "美食杂志摄影风格", "甜品品牌广告风格", "夏日饮品海报风格", "日系清新美食摄影风格"],
      composition: ["俯拍近景", "45度斜拍", "右上角保留文字留白", "主体占画面60%", "4:5竖版", "浅景深特写", "餐具形成引导线"],
      lighting: ["柔和自然窗光", "侧逆光勾边", "黄金时刻暖光", "顶部大面积柔光", "轻微阴影", "高光落在食物边缘"],
      materials: ["水珠附着在杯壁", "奶油纹理细腻", "食材纹理清晰", "陶瓷盘带柔和釉面", "木纹细节自然", "玻璃杯反光干净", "蒸汽轻微可见"],
      environment: ["咖啡店窗边环境", "木纹桌面背景", "大理石台面背景", "柔和米色背景", "厨房操作台背景", "模糊餐厅背景"],
      mood: ["食欲感强", "温暖松弛氛围", "清爽明亮氛围", "精致生活感", "手作温度感", "商业海报质感"],
      constraints: ["无水印", "无logo", "无额外文字", "食物不要变形", "餐具数量不要混乱", "背景干净"]
    }
  },
  {
    id: "education-poster",
    group: "行业服务",
    label: "课程教育",
    description: "课程封面、知识海报、讲座和训练营",
    defaults: {
      subject: ["一位讲师站在简洁白板前"],
      style: ["在线课程封面风格"],
      composition: ["左侧人物右侧文字区", "16:9横版"],
      lighting: ["明亮均匀柔光"],
      materials: ["白板表面干净"],
      environment: ["现代教室背景"],
      mood: ["可信专业氛围", "清晰理性"],
      constraints: []
    },
    optionGroups: {
      subject: ["一位讲师站在简洁白板前", "一本打开的课程笔记和钢笔", "一组知识卡片悬浮排列", "一台显示在线课程界面的笔记本", "一位学生在桌前专注学习", "一张讲座活动主视觉", "一个训练营报名页主视觉"],
      style: ["在线课程封面风格", "知识付费海报风格", "讲座活动海报风格", "教育机构品牌视觉风格", "信息图表海报风格", "极简学习笔记风格"],
      composition: ["左侧人物右侧文字区", "标题区域占画面上方三分之一", "图标围绕主题分布", "16:9横版", "4:5竖版", "中心主标题构图"],
      lighting: ["明亮均匀柔光", "柔和自然窗光", "顶部大面积柔光", "阴天漫射光", "干净无重影灯光", "轻微蓝色科技光"],
      materials: ["白板表面干净", "纸张纤维细节清晰", "屏幕玻璃反光自然", "书本页边清晰", "马克笔笔迹清楚", "桌面木纹自然"],
      environment: ["现代教室背景", "明亮书房背景", "线上会议界面背景", "图书馆模糊背景", "品牌色渐变背景", "极简办公桌背景"],
      mood: ["可信专业氛围", "清晰理性", "积极学习氛围", "轻松易懂", "成长感", "高效训练营氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "文字不要错字", "人物表情自然", "版面不要杂乱"]
    }
  },
  {
    id: "festival-campaign",
    group: "活动节日",
    label: "节日活动",
    description: "节日促销、品牌活动和限定款主视觉",
    defaults: {
      subject: ["春节礼盒与红色装饰物摆放在画面中央"],
      style: ["节日促销海报风格"],
      composition: ["主体居中构图", "顶部保留标题区", "4:5竖版"],
      lighting: ["暖色节日灯光"],
      materials: ["礼盒彩纸纹理清晰"],
      environment: ["红金节日背景"],
      mood: ["热闹喜庆氛围", "商业促销感"],
      constraints: []
    },
    optionGroups: {
      subject: ["春节礼盒与红色装饰物摆放在画面中央", "一组双十一购物袋和优惠券元素", "圣诞限定礼盒放在雪景布置中", "品牌周年庆舞台主视觉", "新品快闪店入口装置", "节日餐桌礼物场景", "一组彩带气球围绕主标题"],
      style: ["节日促销海报风格", "品牌活动主视觉风格", "快闪店宣传视觉风格", "电商大促主视觉风格", "红金礼盒广告风格", "年轻潮流活动海报风格"],
      composition: ["主体居中构图", "顶部保留标题区", "优惠信息位于右侧", "4:5竖版", "1:1方图", "多元素环绕构图", "中心放射式构图"],
      lighting: ["暖色节日灯光", "金色高光", "柔光棚拍", "彩色氛围灯", "顶部大面积柔光", "轻微闪光点缀"],
      materials: ["礼盒彩纸纹理清晰", "金属烫金细节", "丝带材质柔顺", "玻璃橱窗反光自然", "纸袋纹理清晰", "亮片装饰有细小高光"],
      environment: ["红金节日背景", "品牌色渐变背景", "快闪店门头背景", "雪景节日背景", "商场中庭活动背景", "纯净电商棚拍背景"],
      mood: ["热闹喜庆氛围", "商业促销感", "礼物惊喜感", "年轻潮流氛围", "高级节庆质感", "限定款稀缺感"],
      constraints: ["无水印", "无logo", "无额外文字", "促销元素不要杂乱", "礼盒不要变形", "文字区域干净"]
    }
  },
  {
    id: "birthday-party",
    group: "活动节日",
    label: "生日派对",
    description: "给寿星放照片、写几周岁生日的庆生海报",
    defaults: {
      subject: ["寿星照片放在画面中央的圆角照片框中", "生日蛋糕和气球作为装饰"],
      style: ["照片生日海报风格"],
      composition: ["照片位居中构图", "顶部保留几周岁生日标题区", "4:5竖版"],
      lighting: ["暖色派对灯光", "蜡烛柔和光点"],
      materials: ["相纸照片质感清晰", "气球反光柔和"],
      environment: ["生日派对背景", "照片背景保留干净边缘"],
      mood: ["欢乐庆祝氛围", "生日惊喜感"],
      constraints: []
    },
    textDefaults: {
      exact: "3周岁生日",
      position: "顶部居中",
      style: "无衬线加粗",
      title: "生日快乐",
      subtitle: "愿所有美好如约而至",
      label: "HAPPY BIRTHDAY",
      age: "3周岁",
      flags: ["高对比", "仅出现一次", "文字清晰可读", "不要错字"]
    },
    optionGroups: {
      subject: [
        "寿星照片放在画面中央的圆角照片框中",
        "宝宝照片作为主视觉放在生日海报中央",
        "儿童生日照片位于气球拱门中间",
        "上传照片位置保留为干净白色照片框",
        "一张寿星半身照片与生日蛋糕组合",
        "一组生日礼物和彩带围绕照片位",
        "一家人合照放在派对背景中央"
      ],
      style: [
        "照片生日海报风格",
        "生日邀请函视觉风格",
        "儿童生日派对摄影风格",
        "宝宝周岁生日海报风格",
        "精致蛋糕品牌广告风格",
        "温暖家庭庆生摄影风格",
        "梦幻气球派对视觉风格"
      ],
      composition: [
        "照片位居中构图",
        "顶部保留几周岁生日标题区",
        "照片占画面55%",
        "照片框下方放生日蛋糕装饰",
        "气球拱门环绕主体",
        "礼物位于画面下方前景",
        "4:5竖版",
        "1:1方图",
        "照片与文字上下分区清晰",
        "人物位于画面中央偏下"
      ],
      lighting: [
        "暖色派对灯光",
        "蜡烛柔和光点",
        "柔光棚拍",
        "彩色氛围灯",
        "金色高光",
        "顶部大面积柔光",
        "轻微闪光点缀"
      ],
      materials: [
        "相纸照片质感清晰",
        "照片框边缘清晰",
        "照片人物肤色自然",
        "奶油纹理细腻",
        "气球反光柔和",
        "彩带纸张纹理清晰",
        "礼盒包装纸纹理清楚",
        "玻璃杯反光干净",
        "糖霜颗粒细节可见",
        "蜡烛火焰柔和自然"
      ],
      environment: [
        "生日派对背景",
        "照片背景保留干净边缘",
        "彩色气球和彩带布置",
        "温暖家居庆生背景",
        "户外草坪生日野餐背景",
        "柔和粉色渐变背景",
        "儿童派对甜品台背景",
        "夜晚灯串派对背景"
      ],
      mood: [
        "欢乐庆祝氛围",
        "生日惊喜感",
        "温暖家庭氛围",
        "可爱治愈氛围",
        "梦幻甜美氛围",
        "轻松派对感",
        "精致高级庆生氛围"
      ],
      constraints: [
        "无水印",
        "无logo",
        "无额外文字",
        "不要改变照片人物五官",
        "照片区域不要被装饰遮挡",
        "蛋糕不要变形",
        "蜡烛数量不要混乱",
        "人物表情自然",
        "文字区域干净"
      ]
    }
  },
  {
    id: "app-saas",
    group: "科技软件",
    label: "App / SaaS",
    description: "软件产品、数据看板、App 宣传图",
    defaults: {
      subject: ["一台笔记本电脑展示数据仪表盘界面"],
      style: ["SaaS 产品官网主视觉风格"],
      composition: ["设备位于画面中央", "右侧留白用于文字", "16:9横版"],
      lighting: ["冷色科技感灯光"],
      materials: ["屏幕玻璃反光自然"],
      environment: ["深色科技感背景"],
      mood: ["可信专业氛围", "科技感"],
      constraints: []
    },
    optionGroups: {
      subject: ["一台笔记本电脑展示数据仪表盘界面", "一部手机展示 App 首页界面", "多个悬浮 UI 卡片围绕设备", "一个团队协作软件看板界面", "一组 AI 工具功能面板", "一个支付成功界面主视觉", "一张企业数据分析大屏"],
      style: ["SaaS 产品官网主视觉风格", "App Store 宣传图风格", "科技产品海报风格", "B2B 软件广告风格", "极简 UI 展示风格", "未来感数据可视化风格"],
      composition: ["设备位于画面中央", "右侧留白用于文字", "多张 UI 卡片悬浮排列", "16:9横版", "1:1方图", "主体轻微透视角度", "顶部保留标题区"],
      lighting: ["冷色科技感灯光", "柔光棚拍", "屏幕微光照亮边缘", "侧逆光勾边", "蓝紫渐变环境光", "均匀阴影"],
      materials: ["屏幕玻璃反光自然", "金属机身高光清晰", "UI 卡片边缘锐利", "磨砂玻璃拟态质感", "细腻阴影层次", "图标线条清晰"],
      environment: ["深色科技感背景", "浅灰色无缝背景", "品牌色渐变背景", "抽象数据网格背景", "高级工作室背景", "纯净白色背景"],
      mood: ["可信专业氛围", "科技感", "高效智能氛围", "清爽明亮氛围", "未来感", "企业级稳重感"],
      constraints: ["无水印", "无logo", "无额外文字", "界面文字不要乱写", "UI 不要变形", "设备边缘完整"]
    }
  },
  {
    id: "travel-landscape",
    group: "餐饮生活",
    label: "旅行风景",
    description: "城市、自然风光、酒店民宿和旅游海报",
    defaults: {
      subject: ["一处海边悬崖上的度假酒店"],
      style: ["高端旅行海报风格"],
      composition: ["广角远景", "天空保留标题留白", "16:9横版"],
      lighting: ["黄金时刻暖光"],
      materials: ["海面反光自然"],
      environment: ["海边日落背景"],
      mood: ["松弛度假氛围", "向往感"],
      constraints: []
    },
    optionGroups: {
      subject: ["一处海边悬崖上的度假酒店", "一条清晨山谷徒步路线", "一座城市天际线与河流", "一个热带岛屿白沙滩", "一间雪山民宿窗景", "一条欧洲老街咖啡馆", "一辆公路旅行汽车停在荒野边"],
      style: ["高端旅行海报风格", "国家地理摄影风格", "城市旅行摄影风格", "酒店宣传片视觉风格", "户外探险海报风格", "文艺旅行明信片风格"],
      composition: ["广角远景", "天空保留标题留白", "引导线通向远方", "16:9横版", "4:5竖版", "人物作为小比例点景", "前景中景远景分明"],
      lighting: ["黄金时刻暖光", "清晨薄雾柔光", "阴天漫射光", "强烈阳光与清晰阴影", "蓝调时刻光线", "自然逆光"],
      materials: ["海面反光自然", "岩石纹理清晰", "木质露台细节自然", "玻璃窗反射自然", "云层层次丰富", "植被细节清晰"],
      environment: ["海边日落背景", "山谷薄雾背景", "城市天际线背景", "热带沙滩背景", "雪山窗景背景", "欧洲街巷背景"],
      mood: ["松弛度假氛围", "向往感", "自由探索感", "高级旅行质感", "清爽明亮氛围", "安静治愈氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "地平线保持水平", "建筑不要变形", "天空区域干净"]
    }
  },
  {
    id: "beauty-fashion",
    group: "商品商业",
    label: "美妆时尚",
    description: "美妆、香氛、服装穿搭和时尚大片",
    defaults: {
      subject: ["一支口红和镜面托盘放在画面中央"],
      style: ["美妆广告摄影风格"],
      composition: ["居中构图", "产品占画面60%", "顶部留白用于文字", "4:5竖版"],
      lighting: ["柔光棚拍", "侧逆光勾边"],
      materials: ["金属表面带精致高光"],
      environment: ["柔和粉色渐变背景"],
      mood: ["精致高级氛围", "女性时尚质感"],
      constraints: []
    },
    optionGroups: {
      subject: ["一支口红和镜面托盘放在画面中央", "一瓶透明玻璃香水瓶", "一组护肤精华瓶整齐排列", "一位模特展示极简通勤穿搭", "一只戒指放在丝绒托盘上", "一双高跟鞋摆在柔光背景中", "一套彩妆盘打开展示"],
      style: ["美妆广告摄影风格", "时尚杂志封面风格", "奢侈品广告摄影风格", "香氛品牌海报风格", "高级穿搭画报风格", "珠宝广告视觉风格"],
      composition: ["居中构图", "产品占画面60%", "顶部留白用于文字", "4:5竖版", "镜面反射构图", "对角线陈列构图", "浅景深特写"],
      lighting: ["柔光棚拍", "侧逆光勾边", "高光扫过产品边缘", "顶部大面积柔光", "粉色柔和环境光", "高对比硬光"],
      materials: ["金属表面带精致高光", "透明玻璃材质", "镜面托盘反光清晰", "丝绒纹理细腻", "皮革纹理清晰", "液体质感通透"],
      environment: ["柔和粉色渐变背景", "浅灰色无缝背景", "大理石台面背景", "丝绸布景背景", "高级工作室背景", "纯净电商棚拍背景"],
      mood: ["精致高级氛围", "女性时尚质感", "奢华克制氛围", "清爽明亮氛围", "柔美浪漫氛围", "商业海报质感"],
      constraints: ["无水印", "无logo", "无额外文字", "产品不要变形", "妆容不要脏", "反光不要杂乱"]
    }
  },
  {
    id: "livestream-commerce",
    group: "商品商业",
    label: "直播带货",
    description: "直播间主视觉、商品讲解封面和促销转化图",
    defaults: {
      subject: ["一位主播在直播间展示一款无线耳机"],
      style: ["直播带货封面风格"],
      composition: ["人物位于左侧产品位于右侧", "顶部保留标题区", "4:5竖版"],
      lighting: ["明亮均匀柔光"],
      materials: ["产品边缘高光清晰"],
      environment: ["直播间货架背景"],
      mood: ["强促销转化氛围", "清晰可信氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一位主播在直播间展示一款无线耳机", "一位主播手持护肤精华瓶讲解", "一组爆款商品摆在直播桌面", "一张限时秒杀直播封面", "一位达人展示家用小电器", "一组优惠券和商品组合主视觉"],
      style: ["直播带货封面风格", "电商直播间海报风格", "达人种草直播封面风格", "限时秒杀促销视觉风格", "清爽商品讲解封面风格"],
      composition: ["人物位于左侧产品位于右侧", "顶部保留标题区", "优惠信息位于角落", "4:5竖版", "商品占画面45%", "人物表情面向镜头"],
      lighting: ["明亮均匀柔光", "柔光棚拍", "正面补光清晰", "顶部大面积柔光", "商品局部高光", "背景轻微氛围光"],
      materials: ["产品边缘高光清晰", "包装文字区域清楚", "屏幕反光自然", "塑料材质干净", "金属细节有高光", "纸盒纹理清晰"],
      environment: ["直播间货架背景", "品牌色渐变背景", "电商棚拍背景", "简洁桌面背景", "虚化直播屏幕背景", "促销氛围背景"],
      mood: ["强促销转化氛围", "清晰可信氛围", "热闹但不杂乱", "年轻亲和氛围", "专业讲解感", "购买欲强"],
      constraints: ["无水印", "无logo", "无额外文字", "人物表情自然", "商品不要变形", "促销元素不要杂乱"]
    }
  },
  {
    id: "brand-key-visual",
    group: "商品商业",
    label: "品牌 KV",
    description: "新品发布、品牌升级和整合营销主视觉",
    defaults: {
      subject: ["一组品牌核心产品围绕主标题形成主视觉"],
      style: ["品牌年度主视觉风格"],
      composition: ["中心主视觉构图", "品牌标语区域位于上方", "16:9横版"],
      lighting: ["高端商业棚拍光"],
      materials: ["产品材质纹理清晰"],
      environment: ["品牌色渐变背景"],
      mood: ["高级品牌感", "强识别度"],
      constraints: []
    },
    optionGroups: {
      subject: ["一组品牌核心产品围绕主标题形成主视觉", "一个新品发布舞台中央的标志性产品", "一组品牌视觉符号和产品组合", "一个年度营销活动主画面", "一套品牌升级后的视觉资产展示", "一个品牌旗舰店橱窗主视觉"],
      style: ["品牌年度主视觉风格", "新品发布 KV 风格", "整合营销主视觉风格", "高端品牌广告风格", "品牌升级视觉风格", "线下活动主视觉风格"],
      composition: ["中心主视觉构图", "品牌标语区域位于上方", "主体与辅助元素环绕排列", "16:9横版", "4:5竖版", "大面积留白突出品牌调性"],
      lighting: ["高端商业棚拍光", "柔和主光加边缘光", "品牌色环境光", "均匀阴影", "局部聚光突出主体", "高光扫过产品边缘"],
      materials: ["产品材质纹理清晰", "金属高光精致", "玻璃反射自然", "纸张纤维可见", "包装烫金细节清楚", "表面细节自然"],
      environment: ["品牌色渐变背景", "抽象品牌图形背景", "高端工作室背景", "纯净商业背景", "线下展台背景", "低干扰深色背景"],
      mood: ["高级品牌感", "强识别度", "正式发布感", "商业海报质感", "克制高级氛围", "值得信赖"],
      constraints: ["无水印", "无logo", "无额外文字", "主体清晰完整", "品牌元素不要杂乱", "文字区域干净"]
    }
  },
  {
    id: "packaging-design",
    group: "商品商业",
    label: "包装设计",
    description: "盒装、瓶身、礼盒和包装提案展示",
    defaults: {
      subject: ["一套高端茶叶礼盒包装展开陈列"],
      style: ["包装设计提案渲染风格"],
      composition: ["正面平视展示", "包装占画面65%", "1:1方图"],
      lighting: ["柔光棚拍"],
      materials: ["纸盒纹理清晰", "烫金细节精致"],
      environment: ["浅灰色无缝背景"],
      mood: ["精致高级氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一套高端茶叶礼盒包装展开陈列", "一款咖啡豆包装袋正面展示", "一组护肤品外盒和瓶身组合", "一盒节日限定巧克力包装", "一款饮料瓶标签设计展示", "一套文创纸品包装组合"],
      style: ["包装设计提案渲染风格", "高端礼盒摄影风格", "品牌包装展示风格", "极简包装视觉风格", "货架陈列包装风格", "文创包装海报风格"],
      composition: ["正面平视展示", "包装占画面65%", "包装展开平铺", "1:1方图", "3:4比例", "轻微透视展示厚度"],
      lighting: ["柔光棚拍", "顶部大面积柔光", "均匀阴影", "侧逆光勾边", "干净无重影灯光", "高光突出烫金"],
      materials: ["纸盒纹理清晰", "烫金细节精致", "磨砂纸张质感", "透明塑封反光自然", "瓶身标签边缘清楚", "压纹纹理可见"],
      environment: ["浅灰色无缝背景", "品牌色背景", "大理石台面背景", "木纹桌面背景", "纯净白色背景", "陈列架背景"],
      mood: ["精致高级氛围", "礼物惊喜感", "品牌专业感", "克制高级氛围", "商业展示感", "干净秩序感"],
      constraints: ["无水印", "无logo", "无额外文字", "包装不要变形", "边缘不要裁切", "文字区域干净"]
    }
  },
  {
    id: "home-decoration",
    group: "空间建筑",
    label: "家居家装",
    description: "家装方案、家具单品和生活方式空间图",
    defaults: {
      subject: ["一套现代原木风客厅家具组合"],
      style: ["家居品牌生活方式摄影风格"],
      composition: ["广角平视构图", "空间纵深清晰", "16:9横版"],
      lighting: ["柔和自然窗光"],
      materials: ["木纹细节自然", "织物纹理细腻"],
      environment: ["温暖家居背景"],
      mood: ["温暖松弛氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一套现代原木风客厅家具组合", "一张柔软布艺沙发和落地灯", "一间收纳整齐的儿童房", "一处开放式厨房岛台", "一套卧室床品主视觉", "一个阳台休闲角落"],
      style: ["家居品牌生活方式摄影风格", "家装效果图风格", "室内软装杂志风格", "北欧家居海报风格", "智能家居宣传风格", "家具电商场景图风格"],
      composition: ["广角平视构图", "空间纵深清晰", "家具主体位于画面中央", "16:9横版", "4:5竖版", "前景绿植增加层次"],
      lighting: ["柔和自然窗光", "阴天漫射光", "暖色室内灯光", "顶部大面积柔光", "黄金时刻暖光", "干净无重影灯光"],
      materials: ["木纹细节自然", "织物纹理细腻", "皮革纹理清晰", "陶瓷釉面柔和", "金属脚架高光清晰", "玻璃桌面反射自然"],
      environment: ["温暖家居背景", "窗边自然光场景", "极简客厅背景", "开放式厨房背景", "卧室床头背景", "阳台绿植背景"],
      mood: ["温暖松弛氛围", "安静极简氛围", "精致生活感", "亲和舒适感", "高级质感", "自然治愈氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "空间不要变形", "家具比例自然", "垂直线条保持笔直"]
    }
  },
  {
    id: "automotive-transport",
    group: "商品商业",
    label: "汽车交通",
    description: "汽车、骑行、出行工具和速度感海报",
    defaults: {
      subject: ["一辆新能源轿车停在城市夜景前"],
      style: ["汽车广告摄影风格"],
      composition: ["低角度三分之四视角", "车辆占画面65%", "16:9横版"],
      lighting: ["霓虹边缘光", "车身高光清晰"],
      materials: ["金属车漆反光自然"],
      environment: ["城市夜景背景"],
      mood: ["科技速度感"],
      constraints: []
    },
    optionGroups: {
      subject: ["一辆新能源轿车停在城市夜景前", "一辆 SUV 行驶在山路弯道", "一台电动自行车停在街角", "一辆概念跑车处于棚拍场景", "一列高速列车穿过城市站台", "一辆公路旅行汽车停在荒野边"],
      style: ["汽车广告摄影风格", "新能源车科技海报风格", "运动速度感海报风格", "户外越野宣传风格", "高端车棚拍风格", "未来出行视觉风格"],
      composition: ["低角度三分之四视角", "车辆占画面65%", "引导线通向车头", "16:9横版", "车身侧面长构图", "动态追随镜头"],
      lighting: ["霓虹边缘光", "车身高光清晰", "冷色科技感灯光", "黄金时刻暖光", "高对比硬光", "道路反光增强层次"],
      materials: ["金属车漆反光自然", "玻璃车窗反射自然", "轮毂金属高光清晰", "橡胶轮胎纹理清晰", "内饰皮革纹理可见", "车灯透明材质通透"],
      environment: ["城市夜景背景", "山路自然背景", "未来感充电站背景", "深色棚拍背景", "雨后湿润路面", "荒野公路背景"],
      mood: ["科技速度感", "高端稳重感", "自由探索感", "未来感", "强视觉冲击", "可靠安全感"],
      constraints: ["无水印", "无logo", "无额外文字", "车辆不要变形", "车轮保持圆形", "车身边缘完整"]
    }
  },
  {
    id: "parent-child",
    group: "餐饮生活",
    label: "母婴亲子",
    description: "亲子互动、母婴产品和家庭生活场景",
    defaults: {
      subject: ["一位家长和孩子在客厅地毯上互动玩耍"],
      style: ["亲子生活方式摄影风格"],
      composition: ["人物位于画面下半部分", "顶部保留标题区", "4:5竖版"],
      lighting: ["柔和自然窗光"],
      materials: ["织物纹理细腻"],
      environment: ["温暖家居背景"],
      mood: ["温暖亲和氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一位家长和孩子在客厅地毯上互动玩耍", "一款婴儿推车停在明亮玄关", "一组儿童餐具摆放在餐桌上", "一间柔和色彩的儿童房", "一位家长给孩子阅读绘本", "一套母婴护理产品整齐陈列"],
      style: ["亲子生活方式摄影风格", "母婴品牌海报风格", "家庭纪实摄影风格", "儿童用品电商主图风格", "温暖家居广告风格", "绘本感插画风格"],
      composition: ["人物位于画面下半部分", "顶部保留标题区", "亲子互动居中构图", "4:5竖版", "1:1方图", "柔和近景构图"],
      lighting: ["柔和自然窗光", "阴天漫射光", "暖色室内灯光", "顶部大面积柔光", "轻微阴影", "干净无重影灯光"],
      materials: ["织物纹理细腻", "木质玩具纹理自然", "硅胶材质柔和", "纸张绘本纤维可见", "棉质床品柔软", "塑料边缘圆润"],
      environment: ["温暖家居背景", "儿童房背景", "明亮客厅背景", "餐桌生活场景", "窗边自然光场景", "柔和米色背景"],
      mood: ["温暖亲和氛围", "安全可信氛围", "可爱治愈氛围", "家庭幸福感", "轻松自然氛围", "柔和明亮氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "人物表情自然", "手部不要变形", "儿童用品比例自然"]
    }
  },
  {
    id: "medical-health",
    group: "行业服务",
    label: "医疗健康",
    description: "医疗服务、健康管理、药品器械和科普海报",
    defaults: {
      subject: ["一位医生在明亮诊室中查看平板数据"],
      style: ["医疗健康品牌海报风格"],
      composition: ["左侧人物右侧文字区", "16:9横版"],
      lighting: ["明亮均匀柔光"],
      materials: ["医疗器械表面干净"],
      environment: ["现代诊室背景"],
      mood: ["可信专业氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一位医生在明亮诊室中查看平板数据", "一组健康管理 App 数据卡片", "一套家用检测设备放在桌面", "一位护士在医院走廊微笑", "一组药品包装和说明卡片", "一张健康科普海报主视觉"],
      style: ["医疗健康品牌海报风格", "健康科普信息图风格", "医院服务宣传风格", "医疗器械商业摄影风格", "数字健康 App 海报风格", "药品包装广告风格"],
      composition: ["左侧人物右侧文字区", "中心主标题构图", "设备位于画面中央", "16:9横版", "4:5竖版", "图标围绕主题分布"],
      lighting: ["明亮均匀柔光", "干净无重影灯光", "柔和自然窗光", "顶部大面积柔光", "轻微蓝色科技光", "洁净白色环境光"],
      materials: ["医疗器械表面干净", "屏幕玻璃反光自然", "药盒纸张纹理清晰", "白大褂织物纹理自然", "透明试管材质通透", "金属器械高光干净"],
      environment: ["现代诊室背景", "医院走廊背景", "纯净白色背景", "浅蓝品牌色背景", "健康管理数据背景", "实验室桌面背景"],
      mood: ["可信专业氛围", "安全安心感", "清洁明亮氛围", "理性科学感", "温和关怀感", "高效数字化氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "人物表情自然", "医疗场景不要夸张", "文字不要错字"]
    }
  },
  {
    id: "finance-business",
    group: "行业服务",
    label: "金融商务",
    description: "金融服务、企业咨询、投资数据和商务宣传图",
    defaults: {
      subject: ["一位商务人士查看金融数据仪表盘"],
      style: ["金融科技商务海报风格"],
      composition: ["人物位于左侧数据位于右侧", "16:9横版"],
      lighting: ["冷色科技感灯光"],
      materials: ["屏幕玻璃反光自然"],
      environment: ["高端办公室背景"],
      mood: ["可信稳重氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一位商务人士查看金融数据仪表盘", "一组投资分析图表悬浮在屏幕前", "一间高端会议室中的商务讨论", "一个企业服务平台数据看板", "一张保险服务宣传主视觉", "一组银行卡和移动支付界面"],
      style: ["金融科技商务海报风格", "企业咨询宣传视觉风格", "B2B 服务广告风格", "高端商务摄影风格", "数据分析主视觉风格", "保险金融服务海报风格"],
      composition: ["人物位于左侧数据位于右侧", "中心数据看板构图", "16:9横版", "4:5竖版", "大面积深色留白", "图表层叠展示"],
      lighting: ["冷色科技感灯光", "屏幕微光照亮主体", "高端办公室自然光", "侧逆光勾边", "均匀阴影", "局部聚光突出数据"],
      materials: ["屏幕玻璃反光自然", "西装织物纹理细腻", "金属笔记本高光清晰", "纸质合同纹理可见", "UI 卡片边缘锐利", "玻璃会议桌反光自然"],
      environment: ["高端办公室背景", "会议室背景", "城市天际线背景", "深色科技感背景", "金融数据网格背景", "品牌色渐变背景"],
      mood: ["可信稳重氛围", "专业高效感", "科技智能氛围", "企业级安全感", "理性清晰", "高端服务感"],
      constraints: ["无水印", "无logo", "无额外文字", "图表不要乱码", "人物表情自然", "界面不要变形"]
    }
  },
  {
    id: "recruitment-brand",
    group: "行业服务",
    label: "招聘雇主",
    description: "招聘海报、团队文化、雇主品牌和校招视觉",
    defaults: {
      subject: ["一组年轻团队成员在开放办公区协作"],
      style: ["雇主品牌招聘海报风格"],
      composition: ["团队位于画面中央", "顶部保留招聘标题区", "4:5竖版"],
      lighting: ["明亮均匀柔光"],
      materials: ["办公桌面材质自然"],
      environment: ["开放办公区背景"],
      mood: ["年轻积极氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一组年轻团队成员在开放办公区协作", "一位求职者走进现代办公室", "一张校园招聘宣讲会主视觉", "一组员工在会议室头脑风暴", "一个远程团队视频会议画面", "一处企业文化墙前的团队合影"],
      style: ["雇主品牌招聘海报风格", "校园招聘主视觉风格", "企业文化宣传风格", "团队纪实摄影风格", "互联网公司招聘封面风格", "职场社媒封面风格"],
      composition: ["团队位于画面中央", "顶部保留招聘标题区", "人物与文字左右分栏", "4:5竖版", "16:9横版", "多人自然互动构图"],
      lighting: ["明亮均匀柔光", "柔和自然窗光", "办公室环境光", "顶部大面积柔光", "轻微蓝色科技光", "干净无重影灯光"],
      materials: ["办公桌面材质自然", "屏幕玻璃反光自然", "织物纹理细腻", "纸张笔记清晰", "玻璃隔断反射自然", "品牌墙材质清晰"],
      environment: ["开放办公区背景", "现代会议室背景", "校园讲堂背景", "企业文化墙背景", "线上会议界面背景", "城市办公楼背景"],
      mood: ["年轻积极氛围", "开放协作感", "可信专业氛围", "成长感", "活力团队感", "亲和真实氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "人物表情自然", "手部不要变形", "版面不要杂乱"]
    }
  },
  {
    id: "public-service",
    group: "活动节日",
    label: "公益宣传",
    description: "公益倡议、城市文明、环保和社会议题海报",
    defaults: {
      subject: ["一双手托起绿色幼苗和地球元素"],
      style: ["公益宣传海报风格"],
      composition: ["中心象征性主体构图", "底部保留说明文字区", "4:5竖版"],
      lighting: ["柔和自然光"],
      materials: ["植物叶片细节清晰"],
      environment: ["干净自然背景"],
      mood: ["温和有力量"],
      constraints: []
    },
    optionGroups: {
      subject: ["一双手托起绿色幼苗和地球元素", "一组城市志愿者在街道服务", "一张环保减塑主题主视觉", "一个文明出行公益海报场景", "一位儿童望向明亮天空", "一组社区互助温暖场景"],
      style: ["公益宣传海报风格", "环保主题海报风格", "城市文明宣传风格", "社会议题视觉海报风格", "温暖纪实摄影风格", "象征主义插画海报风格"],
      composition: ["中心象征性主体构图", "底部保留说明文字区", "大面积留白突出主题", "4:5竖版", "16:9横版", "人物作为小比例点景"],
      lighting: ["柔和自然光", "黄金时刻暖光", "阴天漫射光", "明亮均匀柔光", "逆光形成希望感", "顶部大面积柔光"],
      materials: ["植物叶片细节清晰", "纸张海报质感", "织物纹理自然", "水面反光自然", "手部皮肤纹理自然", "城市墙面纹理清楚"],
      environment: ["干净自然背景", "城市街道背景", "社区服务场景", "蓝天绿地背景", "浅色渐变背景", "校园公共空间背景"],
      mood: ["温和有力量", "希望感", "可信公益氛围", "清爽明亮氛围", "人文关怀感", "积极行动感"],
      constraints: ["无水印", "无logo", "无额外文字", "人物表情自然", "不要煽情过度", "文字区域干净"]
    }
  },
  {
    id: "guochao-culture",
    group: "艺术表现",
    label: "国潮文创",
    description: "国潮、电商文创、传统元素和节庆文化视觉",
    defaults: {
      subject: ["一套国潮文创礼盒与传统纹样元素"],
      style: ["国潮插画海报风格"],
      composition: ["中心对称构图", "传统纹样环绕主体", "4:5竖版"],
      lighting: ["暖色节日灯光"],
      materials: ["纸张纹理和烫金细节清晰"],
      environment: ["红金传统纹样背景"],
      mood: ["新中式高级氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一套国潮文创礼盒与传统纹样元素", "一只瓷器茶杯和山水图案", "一组中式糕点礼盒主视觉", "一位穿新中式服装的模特", "一个传统节日市集摊位", "一张文博展览主视觉"],
      style: ["国潮插画海报风格", "新中式品牌视觉风格", "文创产品广告风格", "传统纹样现代设计风格", "东方美学摄影风格", "节庆文化主视觉风格"],
      composition: ["中心对称构图", "传统纹样环绕主体", "顶部保留标题区", "4:5竖版", "1:1方图", "山水层次作为背景"],
      lighting: ["暖色节日灯光", "柔光棚拍", "金色高光", "柔和自然窗光", "顶部大面积柔光", "局部聚光突出主体"],
      materials: ["纸张纹理和烫金细节清晰", "瓷器釉面柔和", "丝绸纹理细腻", "木质纹理自然", "金属印章高光清晰", "水墨纸面颗粒可见"],
      environment: ["红金传统纹样背景", "山水画背景", "中式窗棂背景", "文博展厅背景", "木质桌面背景", "品牌色渐变背景"],
      mood: ["新中式高级氛围", "文化厚重感", "节日喜庆氛围", "雅致克制氛围", "文创精致感", "东方美学氛围"],
      constraints: ["无水印", "无logo", "无额外文字", "传统纹样不要杂乱", "人物不要变形", "文字区域干净"]
    }
  },
  {
    id: "minimalist-print",
    group: "艺术表现",
    label: "极简印刷",
    description: "极简海报、印刷品、版式实验和品牌物料",
    defaults: {
      subject: ["一张极简品牌海报平铺在纸面上"],
      style: ["极简印刷海报风格"],
      composition: ["大面积留白", "标题位于上方三分之一", "3:4比例"],
      lighting: ["柔和自然光"],
      materials: ["纸张纤维细节清晰"],
      environment: ["浅灰无缝背景"],
      mood: ["克制高级氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一张极简品牌海报平铺在纸面上", "一组名片和宣传册版式展示", "一本极简画册翻开放在桌面", "一张字体实验海报", "一套展览导视物料", "一张黑白摄影印刷样张"],
      style: ["极简印刷海报风格", "瑞士平面设计风格", "字体排版实验风格", "美术馆展览海报风格", "黑白极简摄影风格", "品牌物料展示风格"],
      composition: ["大面积留白", "标题位于上方三分之一", "网格系统排版", "3:4比例", "1:1方图", "单一主体偏左构图"],
      lighting: ["柔和自然光", "阴天漫射光", "顶部大面积柔光", "干净无重影灯光", "轻微纸面阴影", "均匀柔和照明"],
      materials: ["纸张纤维细节清晰", "哑光纸质感", "油墨边缘清晰", "压纹纹理可见", "装订边缘细节清楚", "照片颗粒质感可见"],
      environment: ["浅灰无缝背景", "白色桌面背景", "混凝土桌面背景", "画廊墙面背景", "纯净白色背景", "低干扰印刷工作室背景"],
      mood: ["克制高级氛围", "安静极简氛围", "专业设计感", "理性秩序感", "艺术展览感", "干净现代感"],
      constraints: ["无水印", "无logo", "无额外文字", "版面不要杂乱", "纸张不要变形", "文字不要错字"]
    }
  },
  {
    id: "retro-magazine",
    group: "内容封面",
    label: "复古杂志",
    description: "复古封面、胶片质感、编辑部大片和怀旧广告",
    defaults: {
      subject: ["一位模特站在复古城市街角看向镜头"],
      style: ["复古杂志封面风格"],
      composition: ["人物居中构图", "顶部保留杂志标题区", "4:5竖版"],
      lighting: ["黄金时刻暖光"],
      materials: ["胶片颗粒质感可见"],
      environment: ["复古城市街景背景"],
      mood: ["怀旧时髦氛围"],
      constraints: []
    },
    optionGroups: {
      subject: ["一位模特站在复古城市街角看向镜头", "一辆经典汽车停在老街旁", "一组复古家电产品摆放在桌面", "一位音乐人拿着黑胶唱片", "一张旧式咖啡馆人物封面", "一个怀旧品牌广告主视觉"],
      style: ["复古杂志封面风格", "胶片广告摄影风格", "八九十年代商业海报风格", "复古时尚大片风格", "怀旧编辑部视觉风格", "旧报纸拼贴风格"],
      composition: ["人物居中构图", "顶部保留杂志标题区", "封面式文字留白", "4:5竖版", "3:4比例", "轻微低角度拍摄"],
      lighting: ["黄金时刻暖光", "复古闪光灯直打", "柔和自然窗光", "高对比硬光", "暖色环境光", "侧逆光勾边"],
      materials: ["胶片颗粒质感可见", "皮革纹理清晰", "旧纸张纹理可见", "金属边缘高光", "织物纹理细腻", "塑料复古质感"],
      environment: ["复古城市街景背景", "老式咖啡馆背景", "唱片店背景", "旧公寓室内背景", "霓虹街角背景", "复古影棚背景"],
      mood: ["怀旧时髦氛围", "电影感强烈", "松弛复古感", "编辑部大片感", "个性鲜明", "温暖怀旧感"],
      constraints: ["无水印", "无logo", "无额外文字", "人物不要变形", "文字不要错字", "复古颗粒不要过重"]
    }
  }
];

function compactOptionList(options: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const option of options) {
    const normalized = option.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function expandStylePresetOptions(preset: ImagePromptStylePreset): ImagePromptStylePreset {
  const textDesign = TEXT_DESIGN_BY_STYLE_PRESET[preset.id] ?? DEFAULT_TEXT_DESIGN;
  const textRecommendation = TEXT_RECOMMENDATION_BY_STYLE_PRESET[preset.id];
  const next: ImagePromptStylePreset = {
    ...preset,
    defaults: { ...preset.defaults },
    optionGroups: { ...preset.optionGroups },
    textDefaults: {
      ...(preset.textDefaults ?? {}),
      position: preset.textDefaults?.position ?? textRecommendation?.position ?? "顶部居中",
      style: preset.textDefaults?.style ?? textRecommendation?.style ?? "无衬线加粗",
      designId: preset.textDefaults?.designId ?? textDesign.id,
      design: preset.textDefaults?.design ?? textDesign.label,
      layout: preset.textDefaults?.layout ?? textDesign.layout,
      hierarchy: preset.textDefaults?.hierarchy ?? textDesign.hierarchy,
      color: preset.textDefaults?.color ?? textDesign.color,
      effect: preset.textDefaults?.effect ?? textDesign.effect,
      safeArea: preset.textDefaults?.safeArea ?? textDesign.safeArea
    }
  };
  for (const key of Object.keys(STYLE_PRESET_OPTION_FALLBACKS) as ImagePromptOptionGroupKey[]) {
    const existing = next.optionGroups[key] ?? [];
    next.optionGroups[key] = compactOptionList([
      ...existing,
      ...STYLE_PRESET_OPTION_FALLBACKS[key]
    ]).slice(0, Math.max(24, existing.length));
  }
  return next;
}

const ALL_STYLE_PRESETS: ImagePromptStylePreset[] = [
  ...STYLE_PRESETS,
  ...ADDITIONAL_STYLE_PRESETS
].map(expandStylePresetOptions);

const SMART_TEMPLATES: ImagePromptSmartTemplate[] = [
  {
    id: "ecommerce-main-image",
    label: "淘宝主图",
    description: "商品居中、卖点标题清楚，适合电商首图和详情页首屏",
    stylePresetId: "ecommerce-main",
    patch: {
      selections: {
        subject: ["一款无线蓝牙耳机悬浮在画面中央"],
        style: ["淘宝主图风格"],
        composition: ["居中构图", "产品占画面70%", "顶部留白用于文字", "3:4比例"],
        lighting: ["柔光棚拍", "均匀阴影", "高端棚拍柔光箱"],
        materials: ["磨砂塑料材质带细腻反光", "高分辨率细节清晰"],
        environment: ["白色渐变背景", "画面留白区域干净"],
        mood: ["高级质感", "整体干净专业氛围"],
        constraints: ["保持产品完整", "不要多余产品"]
      },
      text: {
        exact: "降噪黑科技",
        position: "顶部居中",
        style: "无衬线加粗",
        designId: TEXT_DESIGNS[0].id,
        design: TEXT_DESIGNS[0].label,
        layout: TEXT_DESIGNS[0].layout,
        hierarchy: TEXT_DESIGNS[0].hierarchy,
        color: TEXT_DESIGNS[0].color,
        effect: TEXT_DESIGNS[0].effect,
        safeArea: TEXT_DESIGNS[0].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要错误拼写"]
    }
  },
  {
    id: "brand-kv-launch",
    label: "品牌主视觉",
    description: "新品发布、活动 KV、品牌广告首图",
    stylePresetId: "brand-key-visual",
    patch: {
      selections: {
        subject: ["一个新品发布舞台中央的标志性产品"],
        style: ["新品发布 KV 风格"],
        composition: ["中心主视觉构图", "品牌标语区域位于上方", "大面积留白突出品牌调性"],
        lighting: ["高端商业棚拍光", "柔和主光加边缘光", "局部聚光突出主体"],
        materials: ["产品材质纹理清晰", "包装烫金细节清楚", "高分辨率细节清晰"],
        environment: ["品牌色渐变背景", "抽象品牌图形背景", "低干扰商业背景"],
        mood: ["高级品牌感", "强识别度", "正式发布感"],
        constraints: ["品牌元素不要杂乱", "主体清晰完整"]
      },
      text: {
        exact: "新品发布",
        position: "顶部居中",
        style: "高端品牌字标风格",
        designId: TEXT_DESIGNS[1].id,
        design: TEXT_DESIGNS[1].label,
        layout: TEXT_DESIGNS[1].layout,
        hierarchy: TEXT_DESIGNS[1].hierarchy,
        color: TEXT_DESIGNS[1].color,
        effect: TEXT_DESIGNS[1].effect,
        safeArea: TEXT_DESIGNS[1].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要错误拼写"]
    }
  },
  {
    id: "xiaohongshu-cover",
    label: "小红书封面",
    description: "生活方式、探店种草、清晰标题区",
    stylePresetId: "social-cover",
    patch: {
      selections: {
        subject: ["一位探店博主手持饮品看向镜头"],
        style: ["小红书封面风格"],
        composition: ["封面上方保留标题区", "人物位于画面下半部分", "4:5竖版"],
        lighting: ["柔和自然窗光", "黄金时刻暖光"],
        materials: ["织物纹理细腻", "皮肤质感自然不过度磨皮"],
        environment: ["咖啡店窗边环境", "背景元素支持行业信息但保持简洁"],
        mood: ["温暖松弛氛围", "年轻潮流氛围"],
        constraints: ["人物表情自然", "文字区域干净"]
      },
      text: {
        exact: "周末探店",
        position: "顶部居中",
        style: "现代黑体",
        designId: TEXT_DESIGNS[2].id,
        design: TEXT_DESIGNS[2].label,
        layout: TEXT_DESIGNS[2].layout,
        hierarchy: TEXT_DESIGNS[2].hierarchy,
        color: TEXT_DESIGNS[2].color,
        effect: TEXT_DESIGNS[2].effect,
        safeArea: TEXT_DESIGNS[2].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要遮挡人物面部"]
    }
  },
  {
    id: "short-video-cover",
    label: "短视频封面",
    description: "直播带货、达人讲解、转化型封面",
    stylePresetId: "livestream-commerce",
    patch: {
      selections: {
        subject: ["一位主播在直播间展示一款无线耳机"],
        style: ["直播带货封面风格"],
        composition: ["人物位于左侧产品位于右侧", "顶部保留标题区", "4:5竖版"],
        lighting: ["明亮均匀柔光", "正面补光清晰"],
        materials: ["产品边缘高光清晰", "包装文字区域清楚"],
        environment: ["直播间货架背景", "促销氛围背景"],
        mood: ["强促销转化氛围", "清晰可信氛围"],
        constraints: ["商品不要变形", "促销元素不要杂乱"]
      },
      text: {
        exact: "今晚限时价",
        position: "顶部居中",
        style: "无衬线加粗",
        designId: TEXT_DESIGNS[3].id,
        design: TEXT_DESIGNS[3].label,
        layout: TEXT_DESIGNS[3].layout,
        hierarchy: TEXT_DESIGNS[3].hierarchy,
        color: TEXT_DESIGNS[3].color,
        effect: TEXT_DESIGNS[3].effect,
        safeArea: TEXT_DESIGNS[3].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要错误拼写"]
    }
  },
  {
    id: "birthday-photo",
    label: "生日照片海报",
    description: "放寿星照片，写几周岁生日，装饰不要挡脸",
    stylePresetId: "birthday-party",
    patch: {
      photoDescription: "上传的寿星照片，保留照片人物五官、表情、发型和真实气质",
      selections: {
        subject: ["寿星照片放在画面中央的圆角照片框中"],
        style: ["照片生日海报风格"],
        composition: ["照片位居中构图", "顶部保留几周岁生日标题区", "照片占画面55%", "4:5竖版"],
        lighting: ["暖色派对灯光", "蜡烛柔和光点", "柔光棚拍"],
        materials: ["相纸照片质感清晰", "照片人物肤色自然", "气球反光柔和"],
        environment: ["生日派对背景", "彩色气球和彩带布置", "照片背景保留干净边缘"],
        mood: ["欢乐庆祝氛围", "生日惊喜感", "温暖家庭氛围"],
        constraints: ["不要改变照片人物五官", "照片区域不要被装饰遮挡", "蜡烛数量不要混乱"]
      },
      text: {
        exact: "3周岁生日",
        position: "顶部居中",
        style: "无衬线加粗",
        designId: TEXT_DESIGNS[4].id,
        design: TEXT_DESIGNS[4].label,
        title: "生日快乐",
        subtitle: "愿所有美好如约而至",
        label: "HAPPY BIRTHDAY",
        name: "",
        age: "3周岁",
        layout: TEXT_DESIGNS[4].layout,
        hierarchy: TEXT_DESIGNS[4].hierarchy,
        color: TEXT_DESIGNS[4].color,
        effect: TEXT_DESIGNS[4].effect,
        safeArea: TEXT_DESIGNS[4].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要遮挡人物面部"]
    }
  },
  {
    id: "child-first-birthday",
    label: "宝宝周岁照",
    description: "宝宝照片、周岁标题、柔和可爱氛围",
    stylePresetId: "birthday-party",
    patch: {
      photoDescription: "上传的1岁宝宝照片，圆脸，笑容自然，保留宝宝五官和发型特征",
      selections: {
        subject: ["宝宝照片作为主视觉放在生日海报中央"],
        style: ["宝宝周岁生日海报风格"],
        composition: ["照片位居中构图", "顶部保留几周岁生日标题区", "照片框下方放生日蛋糕装饰", "1:1方图"],
        lighting: ["暖色派对灯光", "柔光棚拍", "轻微闪光点缀"],
        materials: ["相纸照片质感清晰", "奶油纹理细腻", "糖霜颗粒细节可见"],
        environment: ["儿童派对甜品台背景", "柔和粉色渐变背景", "彩色气球和彩带布置"],
        mood: ["可爱治愈氛围", "温暖家庭氛围", "梦幻甜美氛围"],
        constraints: ["不要改变照片人物五官", "照片区域不要被装饰遮挡", "蛋糕不要变形"]
      },
      text: {
        exact: "1周岁生日",
        position: "顶部居中",
        style: "无衬线加粗",
        designId: TEXT_DESIGNS[5].id,
        design: TEXT_DESIGNS[5].label,
        title: "生日快乐",
        subtitle: "健康快乐成长",
        label: "ONE YEAR OLD",
        name: "",
        age: "1周岁",
        layout: TEXT_DESIGNS[5].layout,
        hierarchy: TEXT_DESIGNS[5].hierarchy,
        color: TEXT_DESIGNS[5].color,
        effect: TEXT_DESIGNS[5].effect,
        safeArea: TEXT_DESIGNS[5].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要遮挡人物面部"]
    }
  },
  {
    id: "food-magazine",
    label: "美食杂志图",
    description: "餐饮新品、菜单封面、社媒美食图",
    stylePresetId: "food-drink",
    patch: {
      selections: {
        subject: ["一块草莓奶油蛋糕"],
        style: ["美食杂志摄影风格"],
        composition: ["45度斜拍", "右上角保留文字留白", "浅景深特写", "4:5竖版"],
        lighting: ["柔和自然窗光", "高光落在食物边缘"],
        materials: ["奶油纹理细腻", "食材纹理清晰", "陶瓷盘带柔和釉面"],
        environment: ["咖啡店窗边环境", "木纹桌面背景"],
        mood: ["食欲感强", "精致生活感", "手作温度感"],
        constraints: ["食物不要变形", "餐具数量不要混乱"]
      },
      text: {
        exact: "今日甜品",
        position: "顶部右侧",
        style: "杂志标题风格",
        designId: TEXT_DESIGNS[6].id,
        design: TEXT_DESIGNS[6].label,
        layout: TEXT_DESIGNS[6].layout,
        hierarchy: TEXT_DESIGNS[6].hierarchy,
        color: TEXT_DESIGNS[6].color,
        effect: TEXT_DESIGNS[6].effect,
        safeArea: TEXT_DESIGNS[6].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字"]
    }
  },
  {
    id: "saas-hero",
    label: "App/SaaS 主图",
    description: "软件官网、App 宣传图、科技产品视觉",
    stylePresetId: "app-saas",
    patch: {
      selections: {
        subject: ["一台笔记本电脑展示数据仪表盘界面"],
        style: ["SaaS 产品官网主视觉风格"],
        composition: ["设备位于画面中央", "右侧留白用于文字", "多张 UI 卡片悬浮排列", "16:9横版"],
        lighting: ["冷色科技感灯光", "屏幕微光照亮边缘"],
        materials: ["屏幕玻璃反光自然", "UI 卡片边缘锐利", "磨砂玻璃拟态质感"],
        environment: ["深色科技感背景", "抽象数据网格背景"],
        mood: ["可信专业氛围", "高效智能氛围", "未来感"],
        constraints: ["界面文字不要乱写", "UI 不要变形", "设备边缘完整"]
      },
      text: {
        exact: "智能工作台",
        position: "顶部左侧",
        style: "现代黑体",
        designId: TEXT_DESIGNS[7].id,
        design: TEXT_DESIGNS[7].label,
        layout: TEXT_DESIGNS[7].layout,
        hierarchy: TEXT_DESIGNS[7].hierarchy,
        color: TEXT_DESIGNS[7].color,
        effect: TEXT_DESIGNS[7].effect,
        safeArea: TEXT_DESIGNS[7].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要出现不可读乱码"]
    }
  },
  {
    id: "movie-poster-drama",
    label: "电影海报",
    description: "人物主视觉、强情绪、片名标题区",
    stylePresetId: "movie-poster",
    patch: {
      selections: {
        subject: ["主角站在雨夜街道中央"],
        style: ["电影海报风格"],
        composition: ["主角居中构图", "低角度仰拍", "底部保留演员信息区域", "2:3竖版"],
        lighting: ["高对比硬光", "霓虹边缘光", "电影级轮廓光"],
        materials: ["雨滴和湿润地面反光清晰", "烟雾层次可见"],
        environment: ["模糊城市夜景背景", "深色科技感背景"],
        mood: ["悬疑紧张氛围", "电影感强烈", "电影级张力"],
        constraints: ["人物不要变形", "不要错字"]
      },
      text: {
        exact: "雨夜来信",
        position: "顶部居中",
        style: "杂志标题风格",
        designId: TEXT_DESIGNS[8].id,
        design: TEXT_DESIGNS[8].label,
        layout: TEXT_DESIGNS[8].layout,
        hierarchy: TEXT_DESIGNS[8].hierarchy,
        color: TEXT_DESIGNS[8].color,
        effect: TEXT_DESIGNS[8].effect,
        safeArea: TEXT_DESIGNS[8].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要畸形手指"]
    }
  },
  {
    id: "travel-campaign",
    label: "旅行宣传",
    description: "目的地海报、酒店宣传、旅行社活动图",
    stylePresetId: "travel-landscape",
    patch: {
      selections: {
        subject: ["一处海边悬崖上的度假酒店"],
        style: ["高端旅行海报风格"],
        composition: ["广角远景", "天空保留标题留白", "引导线通向远方", "16:9横版"],
        lighting: ["黄金时刻暖光", "清晨薄雾柔光"],
        materials: ["海面反光自然", "木质露台细节自然", "云层层次丰富"],
        environment: ["海边日落背景", "热带沙滩背景"],
        mood: ["松弛度假氛围", "向往感", "高级旅行质感"],
        constraints: ["地平线保持水平", "建筑不要变形", "天空区域干净"]
      },
      text: {
        exact: "海岛假期",
        position: "顶部居中",
        style: "高端品牌字标风格",
        designId: TEXT_DESIGNS[9].id,
        design: TEXT_DESIGNS[9].label,
        layout: TEXT_DESIGNS[9].layout,
        hierarchy: TEXT_DESIGNS[9].hierarchy,
        color: TEXT_DESIGNS[9].color,
        effect: TEXT_DESIGNS[9].effect,
        safeArea: TEXT_DESIGNS[9].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字"]
    }
  },
  {
    id: "medical-health-poster",
    label: "医疗健康",
    description: "健康科普、医疗器械、数字健康服务海报",
    stylePresetId: "medical-health",
    patch: {
      selections: {
        subject: ["一位医生在明亮诊室中查看平板数据"],
        style: ["医疗健康品牌海报风格"],
        composition: ["左侧人物右侧文字区", "16:9横版", "图标围绕主题分布"],
        lighting: ["明亮均匀柔光", "洁净白色环境光"],
        materials: ["医疗器械表面干净", "屏幕玻璃反光自然", "白大褂织物纹理自然"],
        environment: ["现代诊室背景", "浅蓝品牌色背景"],
        mood: ["可信专业氛围", "安全安心感", "清洁明亮氛围"],
        constraints: ["人物表情自然", "医疗场景不要夸张", "文字不要错字"]
      },
      text: {
        exact: "健康守护",
        position: "顶部右侧",
        style: "现代黑体",
        designId: TEXT_DESIGNS[10].id,
        design: TEXT_DESIGNS[10].label,
        layout: TEXT_DESIGNS[10].layout,
        hierarchy: TEXT_DESIGNS[10].hierarchy,
        color: TEXT_DESIGNS[10].color,
        effect: TEXT_DESIGNS[10].effect,
        safeArea: TEXT_DESIGNS[10].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要错误拼写"]
    }
  },
  {
    id: "finance-business-poster",
    label: "金融商务",
    description: "金融科技、企业服务、咨询投放视觉",
    stylePresetId: "finance-business",
    patch: {
      selections: {
        subject: ["一位商务人士查看金融数据仪表盘"],
        style: ["金融科技商务海报风格"],
        composition: ["人物位于左侧数据位于右侧", "16:9横版", "大面积深色留白"],
        lighting: ["冷色科技感灯光", "屏幕微光照亮主体", "局部聚光突出数据"],
        materials: ["屏幕玻璃反光自然", "西装织物纹理细腻", "UI 卡片边缘锐利"],
        environment: ["高端办公室背景", "金融数据网格背景"],
        mood: ["可信稳重氛围", "专业高效感", "企业级安全感"],
        constraints: ["图表不要乱码", "人物表情自然", "界面不要变形"]
      },
      text: {
        exact: "稳健增长",
        position: "顶部左侧",
        style: "高端品牌字标风格",
        designId: TEXT_DESIGNS[11].id,
        design: TEXT_DESIGNS[11].label,
        layout: TEXT_DESIGNS[11].layout,
        hierarchy: TEXT_DESIGNS[11].hierarchy,
        color: TEXT_DESIGNS[11].color,
        effect: TEXT_DESIGNS[11].effect,
        safeArea: TEXT_DESIGNS[11].safeArea,
        flags: ["高对比", "仅出现一次", "文字清晰可读"]
      },
      constraints: ["无水印", "无logo", "无额外文字", "不要出现不可读乱码"]
    }
  }
];

function createEmptySelections(): Record<ImagePromptOptionGroupKey, string[]> {
  return {
    subject: [],
    style: [],
    composition: [],
    lighting: [],
    materials: [],
    environment: [],
    mood: [],
    constraints: []
  };
}

function createEmptyCustom(): Record<Exclude<ImagePromptOptionGroupKey, "constraints">, string> {
  return {
    subject: "",
    style: "",
    composition: "",
    lighting: "",
    materials: "",
    environment: "",
    mood: ""
  };
}

function normalizeStylePresetId(value: string | undefined): ImagePromptStylePresetId {
  return ALL_STYLE_PRESETS.some((preset) => preset.id === value)
    ? (value as ImagePromptStylePresetId)
    : "ecommerce-main";
}

function getStylePreset(id: ImagePromptStylePresetId): ImagePromptStylePreset {
  return ALL_STYLE_PRESETS.find((preset) => preset.id === id) ?? ALL_STYLE_PRESETS[0];
}

function cloneStylePreset(preset: ImagePromptStylePreset): ImagePromptStylePreset {
  const cloneRecord = (
    record: Partial<Record<ImagePromptOptionGroupKey, string[]>>
  ): Partial<Record<ImagePromptOptionGroupKey, string[]>> => {
    const result: Partial<Record<ImagePromptOptionGroupKey, string[]>> = {};
    for (const key of Object.keys(record) as ImagePromptOptionGroupKey[]) {
      result[key] = [...(record[key] ?? [])];
    }
    return result;
  };

  return {
    ...preset,
    defaults: cloneRecord(preset.defaults),
    optionGroups: cloneRecord(preset.optionGroups)
  };
}

function cloneSmartTemplate(template: ImagePromptSmartTemplate): ImagePromptSmartTemplate {
  const selections: Partial<Record<ImagePromptOptionGroupKey, string[]>> = {};
  for (const key of Object.keys(template.patch.selections ?? {}) as ImagePromptOptionGroupKey[]) {
    selections[key] = [...(template.patch.selections?.[key] ?? [])];
  }

  return {
    ...template,
    patch: {
      ...template.patch,
      selections,
      custom: { ...(template.patch.custom ?? {}) },
      text: template.patch.text
        ? {
            ...template.patch.text,
            flags: template.patch.text.flags ? [...template.patch.text.flags] : undefined
          }
        : undefined,
      constraints: template.patch.constraints ? [...template.patch.constraints] : undefined
    }
  };
}

export function getImagePromptProductTemplates(): ImagePromptProductTemplate[] {
  return PRODUCT_TEMPLATES.map((template) => ({ ...template }));
}

export function getImagePromptStylePresets(
  _productId: ImagePromptProductId = "chatgpt-images-2"
): ImagePromptStylePreset[] {
  return ALL_STYLE_PRESETS.map(cloneStylePreset);
}

export function getImagePromptOptionGroups(
  _productId: ImagePromptProductId = "chatgpt-images-2",
  stylePresetId?: ImagePromptStylePresetId
): ImagePromptOptionGroup[] {
  const preset = stylePresetId ? getStylePreset(normalizeStylePresetId(stylePresetId)) : null;
  return OPTION_GROUPS.map((group) => ({
    ...group,
    options: [...(preset?.optionGroups[group.key] ?? group.options)],
    categories: preset
      ? undefined
      : group.categories?.map((category) => ({
          ...category,
          options: [...category.options]
        }))
  }));
}

export function getImagePromptTextOptions(): {
  positions: string[];
  styles: string[];
  designs: ImagePromptTextDesign[];
  flags: string[];
} {
  return {
    positions: [...TEXT_POSITIONS],
    styles: [...TEXT_STYLES],
    designs: TEXT_DESIGNS.map(cloneTextDesign),
    flags: [...TEXT_FLAGS]
  };
}

export function getImagePromptSmartTemplates(
  _productId: ImagePromptProductId = "chatgpt-images-2"
): ImagePromptSmartTemplate[] {
  return SMART_TEMPLATES.map(cloneSmartTemplate);
}

export function createDefaultImagePromptState(
  stylePresetId: ImagePromptStylePresetId = "ecommerce-main"
): ImagePromptState {
  const normalizedPresetId = normalizeStylePresetId(stylePresetId);
  const preset = getStylePreset(normalizedPresetId);
  const selections = createEmptySelections();
  for (const key of Object.keys(preset.defaults) as ImagePromptOptionGroupKey[]) {
    selections[key] = [...(preset.defaults[key] ?? [])];
  }

  return {
    productId: "chatgpt-images-2",
    stylePresetId: normalizedPresetId,
    photoDescription: "",
    selections,
    custom: createEmptyCustom(),
    text: createTextState(preset.textDefaults),
    constraints: ["无水印", "无logo", "无额外文字"]
  };
}

export function createImagePromptSmartTemplateState(
  templateId: ImagePromptSmartTemplateId
): ImagePromptState {
  const template =
    SMART_TEMPLATES.find((item) => item.id === templateId) ?? SMART_TEMPLATES[0];
  const state = createDefaultImagePromptState(template.stylePresetId);
  const patch = template.patch;

  if (patch.photoDescription !== undefined) {
    state.photoDescription = patch.photoDescription;
  }

  for (const key of Object.keys(patch.selections ?? {}) as ImagePromptOptionGroupKey[]) {
    state.selections[key] = [...(patch.selections?.[key] ?? [])];
  }

  for (const key of Object.keys(patch.custom ?? {}) as Array<
    Exclude<ImagePromptOptionGroupKey, "constraints">
  >) {
    state.custom[key] = patch.custom?.[key] ?? "";
  }

  state.text = {
    ...state.text,
    ...(patch.text ?? {}),
    flags: patch.text?.flags ? [...patch.text.flags] : [...state.text.flags]
  };
  if (patch.constraints) {
    state.constraints = [...patch.constraints];
  }

  return state;
}

function compactParts(parts: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const normalized = part.replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function getGroupParts(
  state: ImagePromptState,
  key: Exclude<ImagePromptOptionGroupKey, "constraints">
): string[] {
  return compactParts([...state.selections[key], state.custom[key]]);
}

function buildTextPart(text: ImagePromptTextState): string {
  const exact = text.exact.trim();
  const birthdayFields = [
    text.age ? `年龄“${text.age}”` : "",
    text.title ? `祝福语“${text.title}”` : "",
    text.name ? `姓名区域“${text.name}”` : "姓名区域“留空或按照片人物填写”",
    text.subtitle ? `副标题“${text.subtitle}”` : "",
    text.label ? `小标签“${text.label}”` : ""
  ];
  const shouldDescribeBirthdayText =
    text.designId.includes("birthday") ||
    Boolean(text.age || text.title || text.subtitle || text.name || text.label);
  if (!exact && !shouldDescribeBirthdayText) {
    return "";
  }
  const rest = compactParts([
    text.position ? `位置${text.position}` : "",
    text.style,
    text.design ? `文字设计：${text.design}` : "",
    text.hierarchy ? `文字层级：${text.hierarchy}` : "",
    text.color ? `文字颜色：${text.color}` : "",
    text.effect ? `文字效果：${text.effect}` : "",
    text.layout ? `文字布局：${text.layout}` : "",
    text.safeArea ? `文字安全区：${text.safeArea}` : "",
    shouldDescribeBirthdayText
      ? `生日文字结构：${compactParts(birthdayFields).join("，")}`
      : "",
    "文字作为画面版式的一部分自然生成，不像后期贴字",
    ...text.flags
  ]);
  return [exact ? `文字：EXACT “${exact}”` : "文字：按文字结构生成", ...rest].join("，");
}

function buildPhotoPart(photoDescription: string): string {
  const description = photoDescription.trim();
  if (!description) {
    return "";
  }
  return `照片人物说明：${description}，以该照片人物作为寿星主体，保留照片人物五官、表情和发型特征`;
}

export function buildImagePrompt(state: ImagePromptState): string {
  const sections = [
    ...getGroupParts(state, "subject")
  ];
  const photoPart = buildPhotoPart(state.photoDescription);
  if (photoPart) {
    sections.push(photoPart);
  }
  sections.push(
    ...getGroupParts(state, "style"),
    ...getGroupParts(state, "composition"),
    ...getGroupParts(state, "lighting"),
    ...getGroupParts(state, "materials"),
    ...getGroupParts(state, "environment"),
    ...getGroupParts(state, "mood")
  );
  const textPart = buildTextPart(state.text);
  if (textPart) {
    sections.push(textPart);
  }
  sections.push(...compactParts([...state.selections.constraints, ...state.constraints]));
  return compactParts(sections).join("，");
}

export function createImagePromptExampleState(): ImagePromptState {
  return {
    productId: "chatgpt-images-2",
    stylePresetId: "ecommerce-main",
    photoDescription: "",
    selections: {
      subject: ["一款无线蓝牙耳机悬浮在画面中央"],
      style: ["商业摄影风格"],
      composition: ["居中构图", "产品占画面70%", "顶部留白用于文字", "3:4比例"],
      lighting: ["柔光棚拍", "均匀阴影"],
      materials: ["磨砂塑料材质带细腻反光"],
      environment: ["白色渐变背景"],
      mood: ["高级质感", "整体干净专业氛围"],
      constraints: []
    },
    custom: createEmptyCustom(),
    text: createTextState({
      exact: "降噪黑科技",
      position: "顶部居中",
      style: "无衬线加粗",
      designId: TEXT_DESIGNS[0].id,
      design: TEXT_DESIGNS[0].label,
      flags: ["高对比", "仅出现一次"]
    }),
    constraints: ["无水印", "无logo", "无额外文字"]
  };
}
