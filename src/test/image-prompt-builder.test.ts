import assert from "node:assert/strict";
import test from "node:test";

import {
  buildImagePrompt,
  createDefaultImagePromptState,
  createImagePromptExampleState,
  createImagePromptSmartTemplateState,
  getImagePromptOptionGroups,
  getImagePromptProductTemplates,
  getImagePromptSmartTemplates,
  getImagePromptStylePresets,
  getImagePromptTextOptions
} from "../shared/image-prompt-builder";

test("chatgpt images prompt builder outputs one natural commercial prompt", () => {
  const state = createImagePromptExampleState();
  const prompt = buildImagePrompt(state);

  assert.equal(prompt.includes("主体："), false);
  assert.equal(prompt.includes("风格："), false);
  assert.equal(prompt.includes("\n"), false);
  assert.match(prompt, /^一款无线蓝牙耳机悬浮在画面中央，商业摄影风格/);
  assert.match(prompt, /产品占画面70%/);
  assert.match(prompt, /3:4比例/);
  assert.match(prompt, /文字：EXACT “降噪黑科技”/);
  assert.match(prompt, /位置顶部居中/);
  assert.match(prompt, /仅出现一次/);
  assert.match(prompt, /无水印，无logo，无额外文字$/);
});

test("prompt builder combines selected option values with custom additions", () => {
  const state = createDefaultImagePromptState();
  state.selections.subject = ["一款透明玻璃香水瓶", "水珠附着在瓶身"];
  state.custom.subject = "瓶盖为银色金属";
  state.selections.style = ["商业产品摄影风格"];
  state.selections.composition = ["居中构图", "产品占画面70%", "顶部留白用于文字", "3:4比例"];
  state.selections.lighting = ["柔光棚拍"];
  state.selections.materials = ["透明玻璃材质", "金属瓶盖带细腻反光"];
  state.selections.environment = ["白色渐变背景"];
  state.selections.mood = ["整体干净专业氛围"];
  state.text.exact = "清透香气";
  state.text.position = "顶部居中";
  state.text.style = "无衬线加粗";
  state.text.flags = ["高对比", "仅出现一次"];
  state.constraints = ["无水印", "无logo", "无额外文字"];

  const prompt = buildImagePrompt(state);

  assert.match(prompt, /一款透明玻璃香水瓶，水珠附着在瓶身，瓶盖为银色金属/);
  assert.match(prompt, /文字：EXACT “清透香气”，位置顶部居中，无衬线加粗，文字设计：电商卖点标题设计/);
  assert.match(prompt, /贴合顶部留白区，不遮挡产品/);
  assert.match(prompt, /高对比，仅出现一次/);
  assert.equal(prompt.includes("undefined"), false);
});

test("option groups provide many selectable values per module", () => {
  const groups = getImagePromptOptionGroups("chatgpt-images-2");
  const requiredGroups = [
    "subject",
    "style",
    "composition",
    "lighting",
    "materials",
    "environment",
    "mood",
    "constraints"
  ];

  for (const key of requiredGroups) {
    const group = groups.find((item) => item.key === key);
    assert.ok(group, `${key} should exist`);
    assert.ok(group.options.length >= 8, `${key} should expose rich options`);
  }
});

test("subject and style options are organized by broad creative categories", () => {
  const groups = getImagePromptOptionGroups("chatgpt-images-2");
  const subject = groups.find((item) => item.key === "subject");
  const style = groups.find((item) => item.key === "style");

  assert.ok(subject?.categories, "subject should expose broad categories");
  assert.ok(style?.categories, "style should expose broad categories");
  assert.ok(subject.categories.length >= 5, "subject should not be product-only");
  assert.ok(style.categories.length >= 5, "style should not be ecommerce-only");

  const subjectLabels = subject.categories.map((item) => item.label);
  const styleLabels = style.categories.map((item) => item.label);
  assert.ok(subjectLabels.includes("人物 / 肖像"));
  assert.ok(subjectLabels.includes("空间 / 建筑"));
  assert.ok(styleLabels.includes("社媒 / 内容"));
  assert.ok(styleLabels.includes("插画 / 设计"));

  assert.match(subject.options.join("，"), /品牌发布会舞台|原创卡通品牌吉祥物/);
  assert.match(style.options.join("，"), /小红书封面风格|电影海报风格|3D 卡通渲染风格/);
});

test("style presets filter the other prompt modules", () => {
  const presets = getImagePromptStylePresets("chatgpt-images-2");

  assert.ok(presets.length >= 24);
  assert.ok(presets.some((preset) => preset.id === "ecommerce-main"));
  assert.ok(presets.some((preset) => preset.id === "social-cover"));
  assert.ok(presets.some((preset) => preset.id === "illustration-ip"));
  assert.ok(presets.some((preset) => preset.id === "food-drink"));
  assert.ok(presets.some((preset) => preset.id === "education-poster"));
  assert.ok(presets.some((preset) => preset.id === "festival-campaign"));
  assert.ok(presets.some((preset) => preset.id === "birthday-party"));
  assert.ok(presets.some((preset) => preset.id === "livestream-commerce"));
  assert.ok(presets.some((preset) => preset.id === "brand-key-visual"));
  assert.ok(presets.some((preset) => preset.id === "packaging-design"));
  assert.ok(presets.some((preset) => preset.id === "medical-health"));

  const ecommerceGroups = getImagePromptOptionGroups("chatgpt-images-2", "ecommerce-main");
  const socialGroups = getImagePromptOptionGroups("chatgpt-images-2", "social-cover");
  const illustrationGroups = getImagePromptOptionGroups("chatgpt-images-2", "illustration-ip");
  const ecommerceSubject = ecommerceGroups.find((item) => item.key === "subject");
  const socialSubject = socialGroups.find((item) => item.key === "subject");
  const socialComposition = socialGroups.find((item) => item.key === "composition");
  const illustrationSubject = illustrationGroups.find((item) => item.key === "subject");

  assert.ok(ecommerceSubject);
  assert.ok(socialSubject);
  assert.ok(socialComposition);
  assert.ok(illustrationSubject);
  assert.ok(ecommerceSubject.options.length < subjectOptionCount());
  assert.match(socialSubject.options.join("，"), /探店博主|生活方式博主/);
  assert.doesNotMatch(socialSubject.options.join("，"), /无线蓝牙耳机/);
  assert.match(socialComposition.options.join("，"), /封面上方保留标题区/);
  assert.match(illustrationSubject.options.join("，"), /原创卡通品牌吉祥物/);
});

test("birthday style preset provides birthday party prompt modules", () => {
  const state = createDefaultImagePromptState("birthday-party");
  state.photoDescription = "3岁小女孩，穿白色连衣裙，笑着看镜头";
  const prompt = buildImagePrompt(state);
  const groups = getImagePromptOptionGroups("chatgpt-images-2", "birthday-party");
  const subject = groups.find((item) => item.key === "subject");
  const composition = groups.find((item) => item.key === "composition");
  const environment = groups.find((item) => item.key === "environment");
  const mood = groups.find((item) => item.key === "mood");

  assert.equal(state.stylePresetId, "birthday-party");
  assert.equal(state.text.exact, "3周岁生日");
  assert.equal(subject?.options[0], "寿星照片放在画面中央的圆角照片框中");
  assert.equal(composition?.options[0], "照片位居中构图");
  assert.match(prompt, /照片位|照片框|寿星照片/);
  assert.match(prompt, /照片人物说明：3岁小女孩，穿白色连衣裙，笑着看镜头/);
  assert.match(prompt, /保留照片人物五官、表情和发型特征/);
  assert.match(prompt, /文字：EXACT “3周岁生日”/);
  assert.match(prompt, /生日蛋糕|气球|彩带/);
  assert.match(subject?.options.join("，") ?? "", /寿星照片|宝宝照片|儿童生日照片/);
  assert.match(environment?.options.join("，") ?? "", /照片背景|生日派对背景|气球/);
  assert.match(mood?.options.join("，") ?? "", /欢乐庆祝氛围|生日惊喜感/);
});

test("style presets are grouped for scalable switching", () => {
  const presets = getImagePromptStylePresets("chatgpt-images-2");
  const groups = new Set(presets.map((preset) => preset.group));

  assert.ok(groups.size >= 8, "style presets should be split into broad groups");
  assert.ok(groups.has("商品商业"));
  assert.ok(groups.has("内容封面"));
  assert.ok(groups.has("行业服务"));
  assert.ok(groups.has("艺术表现"));

  for (const preset of presets) {
    assert.equal(typeof preset.group, "string", `${preset.id} should have a group`);
    assert.ok(preset.group.length > 0, `${preset.id} group should not be empty`);
  }
});

test("each style preset exposes rich options for all eight modules", () => {
  const presets = getImagePromptStylePresets("chatgpt-images-2");
  const groupKeys = [
    "subject",
    "style",
    "composition",
    "lighting",
    "materials",
    "environment",
    "mood",
    "constraints"
  ];

  for (const preset of presets) {
    const groups = getImagePromptOptionGroups("chatgpt-images-2", preset.id);
    for (const key of groupKeys) {
      const group = groups.find((item) => item.key === key);
      assert.ok(group, `${preset.id}:${key} should exist`);
      assert.ok(
        group.options.length >= 10,
        `${preset.id}:${key} should expose at least 10 options`
      );
    }
  }
});

test("default state can be created from a style preset", () => {
  const state = createDefaultImagePromptState("movie-poster");
  const prompt = buildImagePrompt(state);

  assert.equal(state.stylePresetId, "movie-poster");
  assert.match(prompt, /电影海报风格/);
  assert.match(prompt, /主角/);
  assert.doesNotMatch(prompt, /淘宝主图风格/);
});

test("style presets recommend scene-aware text position and typography", () => {
  const ecommerce = createDefaultImagePromptState("ecommerce-main");
  const movie = createDefaultImagePromptState("movie-poster");
  const app = createDefaultImagePromptState("app-saas");
  const travel = createDefaultImagePromptState("travel-landscape");
  const portrait = createDefaultImagePromptState("portrait-photo");

  assert.equal(ecommerce.text.position, "顶部居中");
  assert.equal(ecommerce.text.style, "无衬线加粗");

  assert.equal(movie.text.position, "底部居中");
  assert.equal(movie.text.style, "杂志标题风格");
  assert.match(movie.text.layout, /片名|光影/);

  assert.equal(app.text.position, "顶部左侧");
  assert.equal(app.text.style, "现代黑体");
  assert.match(app.text.safeArea, /屏幕|UI/);

  assert.equal(travel.text.position, "顶部居中");
  assert.equal(travel.text.style, "高端品牌字标风格");
  assert.match(travel.text.color, /白色|沙金|深色/);

  assert.equal(portrait.text.position, "底部居中");
  assert.equal(portrait.text.style, "细字重无衬线");
  assert.match(portrait.text.safeArea, /面部|眼睛/);
});

test("product templates expose chatgpt images 2.0 as the default product", () => {
  const templates = getImagePromptProductTemplates();

  assert.ok(templates.length >= 1);
  assert.equal(templates[0]?.id, "chatgpt-images-2");
  assert.equal(templates[0]?.label, "ChatGPT Images 2.0");
});

test("text options provide scene-aware typography design choices", () => {
  const textOptions = getImagePromptTextOptions() as {
    designs?: Array<{
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
    }>;
  };

  assert.ok(Array.isArray(textOptions.designs), "text options should expose text design choices");
  assert.ok(textOptions.designs.length >= 12, "text design choices should cover core scenes");
  const designText = textOptions.designs.map((design) => design.label).join("，");
  assert.match(designText, /电商卖点标题设计/);
  assert.match(designText, /温柔生日标题设计/);

  const birthdayDesign = textOptions.designs.find((design) => design.id === "birthday-soft");
  assert.ok(birthdayDesign, "birthday text design should have a stable id");
  assert.match(birthdayDesign.summary, /生日/);
  assert.match(birthdayDesign.typography, /圆润/);
  assert.match(birthdayDesign.color, /浅金|粉色|奶油白/);
  assert.match(birthdayDesign.effect, /投影|描边/);
  assert.match(birthdayDesign.layout, /气球|蛋糕|装饰/);
  assert.match(birthdayDesign.safeArea, /不遮挡/);
  assert.ok(birthdayDesign.keywords.includes("不挡脸"));
});

test("smart templates provide ready-to-use prompt scenarios", () => {
  const templates = getImagePromptSmartTemplates("chatgpt-images-2");
  const templateIds = new Set(templates.map((template) => template.id));
  const presetIds = new Set(getImagePromptStylePresets("chatgpt-images-2").map((preset) => preset.id));

  assert.ok(templates.length >= 12, "smart templates should cover common commercial scenarios");
  assert.ok(templateIds.has("ecommerce-main-image"));
  assert.ok(templateIds.has("xiaohongshu-cover"));
  assert.ok(templateIds.has("birthday-photo"));
  assert.ok(templateIds.has("child-first-birthday"));

  for (const template of templates) {
    assert.ok(presetIds.has(template.stylePresetId), `${template.id} should reference a valid style`);
    assert.ok(template.label.length > 0, `${template.id} should have a label`);
    assert.ok(template.description.length > 0, `${template.id} should explain the use case`);
    assert.equal(
      typeof template.patch.text?.designId,
      "string",
      `${template.id} should provide a scene-aware text design id`
    );
    assert.ok(
      template.patch.text?.designId?.trim(),
      `${template.id} text design id should not be empty`
    );
    assert.equal(
      typeof template.patch.text?.layout,
      "string",
      `${template.id} should provide a template-specific text layout instruction`
    );
  }

  const ecommerce = createImagePromptSmartTemplateState("ecommerce-main-image");
  const ecommercePrompt = buildImagePrompt(ecommerce);
  assert.match(ecommercePrompt, /文字设计：电商卖点标题设计/);
  assert.match(ecommercePrompt, /文字层级：主标题为唯一大标题/);
  assert.match(ecommercePrompt, /文字颜色：黑色或深灰/);
  assert.match(ecommercePrompt, /顶部留白区/);

  const birthday = createImagePromptSmartTemplateState("birthday-photo");
  const birthdayPrompt = buildImagePrompt(birthday);

  assert.equal(birthday.stylePresetId, "birthday-party");
  assert.match(birthday.photoDescription, /照片|寿星/);
  assert.match(birthday.text.exact, /生日|周岁/);
  assert.match(
    (birthday.text as typeof birthday.text & { design?: string }).design ?? "",
    /温柔生日标题设计/
  );
  assert.equal(
    (birthday.text as typeof birthday.text & { designId?: string }).designId,
    "birthday-soft"
  );
  assert.equal(
    (birthday.text as typeof birthday.text & { age?: string }).age,
    "3周岁"
  );
  assert.equal(
    (birthday.text as typeof birthday.text & { title?: string }).title,
    "生日快乐"
  );
  assert.match(birthdayPrompt, /照片人物说明/);
  assert.match(birthdayPrompt, /EXACT/);
  assert.match(birthdayPrompt, /文字设计：温柔生日标题设计/);
  assert.match(birthdayPrompt, /生日文字结构：年龄“3周岁”/);
  assert.match(birthdayPrompt, /祝福语“生日快乐”/);
  assert.match(birthdayPrompt, /姓名区域/);
  assert.match(birthdayPrompt, /不遮挡照片人物/);
  assert.equal(birthdayPrompt.includes("undefined"), false);
});

test("smart template states only select options available to their linked style", () => {
  const templates = getImagePromptSmartTemplates("chatgpt-images-2");

  for (const template of templates) {
    const state = createImagePromptSmartTemplateState(template.id);
    const groups = getImagePromptOptionGroups("chatgpt-images-2", state.stylePresetId);
    const allowed = new Map(groups.map((group) => [group.key, new Set(group.options)]));

    for (const group of groups) {
      for (const selected of state.selections[group.key]) {
        assert.ok(
          allowed.get(group.key)?.has(selected),
          `${template.id}:${group.key} selected "${selected}" should be available in ${state.stylePresetId}`
        );
      }
    }
  }
});

function subjectOptionCount(): number {
  const allSubject = getImagePromptOptionGroups("chatgpt-images-2").find(
    (item) => item.key === "subject"
  );
  return allSubject?.options.length ?? 0;
}
