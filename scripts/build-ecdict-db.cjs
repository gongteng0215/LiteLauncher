/**
 * Build src/assets/ecdict.db from ECDICT CSV (or embedded seed).
 *
 * Usage:
 *   node scripts/build-ecdict-db.cjs
 *   node scripts/build-ecdict-db.cjs --csv path/to/ecdict.csv
 *
 * Place the full ECDICT CSV at scripts/vendor/ecdict.csv, then run this script.
 * All single words and phrases that have a Chinese translation are imported
 * (~760k rows). English definitions are kept only for common words (exam tags,
 * Collins/Oxford, or high frequency) to keep the DB near ~86MB.
 * Without CSV, a compact seed covering common CET/日常词 is used so the feature
 * works offline out of the box.
 */
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const OUT_DB = path.join("src", "assets", "ecdict.db");
const DEFAULT_CSV = path.join("scripts", "vendor", "ecdict.csv");

/** @type {Array<[string, string, string, string, string, number, number, string, string]>} */
const SEED_ROWS = [
  ["a", "ə", "art. 一(个)；每一", "indefinite article", "art", 5, 1, "zk gk cet4", ""],
  ["about", "əˈbaʊt", "prep. 关于；大约 adv. 大约", "concerning; approximately", "prep/adv", 5, 1, "zk gk cet4", ""],
  ["after", "ˈæftə", "prep./conj. 在…以后", "later in time than", "prep/conj", 5, 1, "zk gk cet4", ""],
  ["again", "əˈɡen", "adv. 再；又", "once more", "adv", 5, 1, "zk gk cet4", ""],
  ["all", "ɔːl", "adj./pron. 全部；所有", "the whole of", "adj/pron", 5, 1, "zk gk cet4", ""],
  ["also", "ˈɔːlsəʊ", "adv. 也；同样", "in addition", "adv", 5, 1, "zk gk cet4", ""],
  ["and", "ænd", "conj. 和；并且", "connecting words", "conj", 5, 1, "zk gk cet4", ""],
  ["apple", "ˈæpl", "n. 苹果", "a round fruit", "n", 4, 1, "zk gk cet4", ""],
  ["ask", "ɑːsk", "v. 问；请求", "to put a question", "v", 5, 1, "zk gk cet4", "s:asks/d:asked/i:asking"],
  ["because", "bɪˈkɒz", "conj. 因为", "for the reason that", "conj", 5, 1, "zk gk cet4", ""],
  ["before", "bɪˈfɔː", "prep./adv./conj. 在…以前", "earlier than", "prep/adv/conj", 5, 1, "zk gk cet4", ""],
  ["book", "bʊk", "n. 书 v. 预订", "a written work; to reserve", "n/v", 5, 1, "zk gk cet4", "s:books/d:booked"],
  ["build", "bɪld", "v. 建造", "to construct", "v", 5, 1, "zk gk cet4 cet6", "s:builds/d:built/i:building"],
  ["business", "ˈbɪznəs", "n. 商业；事务", "commerce; matters", "n", 5, 1, "cet4 cet6", ""],
  ["but", "bʌt", "conj. 但是", "however", "conj", 5, 1, "zk gk cet4", ""],
  ["by", "baɪ", "prep. 被；通过；在…旁边", "beside; by means of", "prep", 5, 1, "zk gk cet4", ""],
  ["can", "kæn", "v. 能；可以", "be able to", "v", 5, 1, "zk gk cet4", ""],
  ["change", "tʃeɪndʒ", "v./n. 改变；零钱", "to make different; coins", "v/n", 5, 1, "zk gk cet4", "s:changes/d:changed"],
  ["child", "tʃaɪld", "n. 孩子", "a young person", "n", 5, 1, "zk gk cet4", "p:children"],
  ["city", "ˈsɪti", "n. 城市", "a large town", "n", 5, 1, "zk gk cet4", "s:cities"],
  ["come", "kʌm", "v. 来", "to move toward", "v", 5, 1, "zk gk cet4", "s:comes/d:came/i:coming"],
  ["company", "ˈkʌmpəni", "n. 公司；陪伴", "a business firm", "n", 5, 1, "cet4 cet6", "s:companies"],
  ["computer", "kəmˈpjuːtə", "n. 计算机", "an electronic device", "n", 5, 1, "zk gk cet4", "s:computers"],
  ["day", "deɪ", "n. 天；白天", "a 24-hour period", "n", 5, 1, "zk gk cet4", "s:days"],
  ["do", "duː", "v. 做", "to perform", "v", 5, 1, "zk gk cet4", "s:does/d:did/i:doing/0:done"],
  ["early", "ˈɜːli", "adj./adv. 早的；早地", "before the usual time", "adj/adv", 5, 1, "zk gk cet4", ""],
  ["easy", "ˈiːzi", "adj. 容易的", "not difficult", "adj", 5, 1, "zk gk cet4", ""],
  ["english", "ˈɪŋɡlɪʃ", "n./adj. 英语；英国的", "the English language", "n/adj", 5, 1, "zk gk cet4", ""],
  ["example", "ɪɡˈzɑːmpl", "n. 例子", "a representative case", "n", 5, 1, "zk gk cet4", "s:examples"],
  ["family", "ˈfæməli", "n. 家庭", "parents and children", "n", 5, 1, "zk gk cet4", "s:families"],
  ["find", "faɪnd", "v. 找到；发现", "to discover", "v", 5, 1, "zk gk cet4", "s:finds/d:found/i:finding"],
  ["first", "fɜːst", "adj./adv. 第一；首先", "coming before all others", "adj/adv", 5, 1, "zk gk cet4", ""],
  ["for", "fɔː", "prep. 为了；给", "intended to belong to", "prep", 5, 1, "zk gk cet4", ""],
  ["friend", "frend", "n. 朋友", "a person one likes", "n", 5, 1, "zk gk cet4", "s:friends"],
  ["from", "frɒm", "prep. 从；来自", "indicating origin", "prep", 5, 1, "zk gk cet4", ""],
  ["get", "ɡet", "v. 得到；变得", "to obtain; become", "v", 5, 1, "zk gk cet4", "s:gets/d:got/i:getting"],
  ["give", "ɡɪv", "v. 给", "to hand over", "v", 5, 1, "zk gk cet4", "s:gives/d:gave/i:giving/0:given"],
  ["go", "ɡəʊ", "v. 去", "to move", "v", 5, 1, "zk gk cet4", "s:goes/d:went/i:going/0:gone"],
  ["good", "ɡʊd", "adj. 好的", "of high quality", "adj", 5, 1, "zk gk cet4", ""],
  ["have", "hæv", "v. 有", "to possess", "v", 5, 1, "zk gk cet4", "s:has/d:had/i:having"],
  ["hello", "həˈləʊ", "int. 你好", "a greeting", "int", 4, 1, "zk gk", ""],
  ["help", "help", "v./n. 帮助", "to assist", "v/n", 5, 1, "zk gk cet4", "s:helps/d:helped"],
  ["here", "hɪə", "adv. 这里", "in this place", "adv", 5, 1, "zk gk cet4", ""],
  ["home", "həʊm", "n./adv. 家；在家", "place of residence", "n/adv", 5, 1, "zk gk cet4", ""],
  ["house", "haʊs", "n. 房子", "a building for living", "n", 5, 1, "zk gk cet4", "s:houses"],
  ["how", "haʊ", "adv. 怎样；多么", "in what way", "adv", 5, 1, "zk gk cet4", ""],
  ["i", "aɪ", "pron. 我", "the speaker", "pron", 5, 1, "zk gk cet4", ""],
  ["if", "ɪf", "conj. 如果", "on condition that", "conj", 5, 1, "zk gk cet4", ""],
  ["important", "ɪmˈpɔːtnt", "adj. 重要的", "of great significance", "adj", 5, 1, "zk gk cet4", ""],
  ["in", "ɪn", "prep./adv. 在…里", "inside", "prep/adv", 5, 1, "zk gk cet4", ""],
  ["information", "ˌɪnfəˈmeɪʃn", "n. 信息", "facts or knowledge", "n", 5, 1, "cet4 cet6", ""],
  ["into", "ˈɪntuː", "prep. 进入", "to the inside of", "prep", 5, 1, "zk gk cet4", ""],
  ["it", "ɪt", "pron. 它", "thing previously mentioned", "pron", 5, 1, "zk gk cet4", ""],
  ["just", "dʒʌst", "adv. 仅仅；刚才", "exactly; recently", "adv", 5, 1, "zk gk cet4", ""],
  ["know", "nəʊ", "v. 知道；认识", "to be aware of", "v", 5, 1, "zk gk cet4", "s:knows/d:knew/i:knowing/0:known"],
  ["language", "ˈlæŋɡwɪdʒ", "n. 语言", "system of communication", "n", 5, 1, "zk gk cet4", "s:languages"],
  ["learn", "lɜːn", "v. 学习", "to gain knowledge", "v", 5, 1, "zk gk cet4", "s:learns/d:learned/i:learning"],
  ["like", "laɪk", "v./prep. 喜欢；像", "to enjoy; similar to", "v/prep", 5, 1, "zk gk cet4", "s:likes/d:liked"],
  ["look", "lʊk", "v./n. 看；外表", "to direct eyes", "v/n", 5, 1, "zk gk cet4", "s:looks/d:looked"],
  ["make", "meɪk", "v. 做；使", "to create; cause", "v", 5, 1, "zk gk cet4", "s:makes/d:made/i:making"],
  ["man", "mæn", "n. 男人；人", "an adult male", "n", 5, 1, "zk gk cet4", "p:men"],
  ["many", "ˈmeni", "adj./pron. 许多", "a large number", "adj/pron", 5, 1, "zk gk cet4", ""],
  ["may", "meɪ", "v. 可以；可能", "expressing possibility", "v", 5, 1, "zk gk cet4", ""],
  ["me", "miː", "pron. 我（宾格）", "objective form of I", "pron", 5, 1, "zk gk cet4", ""],
  ["more", "mɔː", "adj./adv. 更多", "a greater amount", "adj/adv", 5, 1, "zk gk cet4", ""],
  ["most", "məʊst", "adj./adv. 最多；最", "greatest in amount", "adj/adv", 5, 1, "zk gk cet4", ""],
  ["my", "maɪ", "pron. 我的", "belonging to me", "pron", 5, 1, "zk gk cet4", ""],
  ["name", "neɪm", "n./v. 名字；命名", "a word by which someone is known", "n/v", 5, 1, "zk gk cet4", "s:names/d:named"],
  ["need", "niːd", "v./n. 需要", "require", "v/n", 5, 1, "zk gk cet4", "s:needs/d:needed"],
  ["new", "njuː", "adj. 新的", "not existing before", "adj", 5, 1, "zk gk cet4", ""],
  ["next", "nekst", "adj./adv. 下一个；然后", "coming immediately after", "adj/adv", 5, 1, "zk gk cet4", ""],
  ["no", "nəʊ", "adv./adj. 不；没有", "negative response", "adv/adj", 5, 1, "zk gk cet4", ""],
  ["not", "nɒt", "adv. 不", "negation", "adv", 5, 1, "zk gk cet4", ""],
  ["now", "naʊ", "adv. 现在", "at the present time", "adv", 5, 1, "zk gk cet4", ""],
  ["of", "ɒv", "prep. …的", "belonging to", "prep", 5, 1, "zk gk cet4", ""],
  ["on", "ɒn", "prep./adv. 在…上", "supported by", "prep/adv", 5, 1, "zk gk cet4", ""],
  ["one", "wʌn", "num./pron. 一；一个", "the number 1", "num/pron", 5, 1, "zk gk cet4", ""],
  ["only", "ˈəʊnli", "adv./adj. 仅仅；唯一的", "and no one else", "adv/adj", 5, 1, "zk gk cet4", ""],
  ["or", "ɔː", "conj. 或者", "used to link alternatives", "conj", 5, 1, "zk gk cet4", ""],
  ["other", "ˈʌðə", "adj./pron. 其他的", "different from one already mentioned", "adj/pron", 5, 1, "zk gk cet4", ""],
  ["our", "ˈaʊə", "pron. 我们的", "belonging to us", "pron", 5, 1, "zk gk cet4", ""],
  ["out", "aʊt", "adv./prep. 出；在外", "away from inside", "adv/prep", 5, 1, "zk gk cet4", ""],
  ["over", "ˈəʊvə", "prep./adv. 在…上方；结束", "above; finished", "prep/adv", 5, 1, "zk gk cet4", ""],
  ["people", "ˈpiːpl", "n. 人们", "human beings", "n", 5, 1, "zk gk cet4", ""],
  ["person", "ˈpɜːsn", "n. 人", "a human being", "n", 5, 1, "zk gk cet4", "s:people"],
  ["place", "pleɪs", "n./v. 地方；放置", "a particular position", "n/v", 5, 1, "zk gk cet4", "s:places/d:placed"],
  ["please", "pliːz", "int./v. 请；使高兴", "polite request", "int/v", 5, 1, "zk gk cet4", ""],
  ["problem", "ˈprɒbləm", "n. 问题", "a matter difficult to deal with", "n", 5, 1, "zk gk cet4", "s:problems"],
  ["question", "ˈkwestʃən", "n./v. 问题；询问", "a sentence seeking information", "n/v", 5, 1, "zk gk cet4", "s:questions"],
  ["read", "riːd", "v. 阅读", "to look at and understand written words", "v", 5, 1, "zk gk cet4", "s:reads/d:read/i:reading"],
  ["right", "raɪt", "adj./n./adv. 正确的；右边；恰好", "correct; opposite of left", "adj/n/adv", 5, 1, "zk gk cet4", ""],
  ["say", "seɪ", "v. 说", "to utter words", "v", 5, 1, "zk gk cet4", "s:says/d:said/i:saying"],
  ["school", "skuːl", "n. 学校", "an institution for education", "n", 5, 1, "zk gk cet4", "s:schools"],
  ["see", "siː", "v. 看见；明白", "to perceive with eyes", "v", 5, 1, "zk gk cet4", "s:sees/d:saw/i:seeing/0:seen"],
  ["should", "ʃʊd", "v. 应该", "used to indicate obligation", "v", 5, 1, "zk gk cet4", ""],
  ["some", "sʌm", "adj./pron. 一些", "an unspecified amount", "adj/pron", 5, 1, "zk gk cet4", ""],
  ["something", "ˈsʌmθɪŋ", "pron. 某事；某物", "an unspecified thing", "pron", 5, 1, "zk gk cet4", ""],
  ["take", "teɪk", "v. 拿；花费", "to get into one's possession", "v", 5, 1, "zk gk cet4", "s:takes/d:took/i:taking/0:taken"],
  ["talk", "tɔːk", "v./n. 谈话", "to speak", "v/n", 5, 1, "zk gk cet4", "s:talks/d:talked"],
  ["tell", "tel", "v. 告诉", "to communicate information", "v", 5, 1, "zk gk cet4", "s:tells/d:told/i:telling"],
  ["than", "ðæn", "conj./prep. 比", "introducing the second element of comparison", "conj/prep", 5, 1, "zk gk cet4", ""],
  ["that", "ðæt", "pron./conj. 那；引导从句", "used to identify", "pron/conj", 5, 1, "zk gk cet4", ""],
  ["the", "ðə", "art. 这；那", "definite article", "art", 5, 1, "zk gk cet4", ""],
  ["their", "ðeə", "pron. 他们的", "belonging to them", "pron", 5, 1, "zk gk cet4", ""],
  ["them", "ðem", "pron. 他们（宾格）", "objective form of they", "pron", 5, 1, "zk gk cet4", ""],
  ["then", "ðen", "adv. 然后；那时", "at that time; next", "adv", 5, 1, "zk gk cet4", ""],
  ["there", "ðeə", "adv. 那里", "in that place", "adv", 5, 1, "zk gk cet4", ""],
  ["they", "ðeɪ", "pron. 他们", "people or things previously mentioned", "pron", 5, 1, "zk gk cet4", ""],
  ["think", "θɪŋk", "v. 想；认为", "to have an opinion", "v", 5, 1, "zk gk cet4", "s:thinks/d:thought/i:thinking"],
  ["this", "ðɪs", "pron./adj. 这", "used to identify a nearby person/thing", "pron/adj", 5, 1, "zk gk cet4", ""],
  ["time", "taɪm", "n. 时间；次数", "the indefinite continued progress of existence", "n", 5, 1, "zk gk cet4", "s:times"],
  ["to", "tuː", "prep. 到；向", "expressing direction", "prep", 5, 1, "zk gk cet4", ""],
  ["today", "təˈdeɪ", "n./adv. 今天", "this present day", "n/adv", 5, 1, "zk gk cet4", ""],
  ["translate", "trænsˈleɪt", "v. 翻译", "to express in another language", "v", 4, 1, "cet4 cet6", "s:translates/d:translated/i:translating"],
  ["two", "tuː", "num. 二", "the number 2", "num", 5, 1, "zk gk cet4", ""],
  ["up", "ʌp", "adv./prep. 向上", "toward a higher place", "adv/prep", 5, 1, "zk gk cet4", ""],
  ["use", "juːz", "v./n. 使用", "to employ for a purpose", "v/n", 5, 1, "zk gk cet4", "s:uses/d:used/i:using"],
  ["very", "ˈveri", "adv. 非常", "to a high degree", "adv", 5, 1, "zk gk cet4", ""],
  ["want", "wɒnt", "v. 想要", "to desire", "v", 5, 1, "zk gk cet4", "s:wants/d:wanted"],
  ["water", "ˈwɔːtə", "n. 水", "a colorless liquid", "n", 5, 1, "zk gk cet4", ""],
  ["way", "weɪ", "n. 方式；路", "a method; a road", "n", 5, 1, "zk gk cet4", "s:ways"],
  ["we", "wiː", "pron. 我们", "the speaker and others", "pron", 5, 1, "zk gk cet4", ""],
  ["well", "wel", "adv./adj. 好地；健康的", "in a good way", "adv/adj", 5, 1, "zk gk cet4", ""],
  ["what", "wɒt", "pron./adj. 什么", "asking for information", "pron/adj", 5, 1, "zk gk cet4", ""],
  ["when", "wen", "adv./conj. 何时；当…时", "at what time", "adv/conj", 5, 1, "zk gk cet4", ""],
  ["where", "weə", "adv./conj. 哪里", "in what place", "adv/conj", 5, 1, "zk gk cet4", ""],
  ["which", "wɪtʃ", "pron./adj. 哪一个", "asking for choice", "pron/adj", 5, 1, "zk gk cet4", ""],
  ["who", "huː", "pron. 谁", "what or which person", "pron", 5, 1, "zk gk cet4", ""],
  ["why", "waɪ", "adv. 为什么", "for what reason", "adv", 5, 1, "zk gk cet4", ""],
  ["will", "wɪl", "v./n. 将；意志", "expressing future", "v/n", 5, 1, "zk gk cet4", ""],
  ["with", "wɪð", "prep. 和…一起；用", "accompanied by", "prep", 5, 1, "zk gk cet4", ""],
  ["word", "wɜːd", "n. 单词；话", "a unit of language", "n", 5, 1, "zk gk cet4", "s:words"],
  ["work", "wɜːk", "n./v. 工作", "activity involving effort", "n/v", 5, 1, "zk gk cet4", "s:works/d:worked"],
  ["world", "wɜːld", "n. 世界", "the earth and all its people", "n", 5, 1, "zk gk cet4", ""],
  ["would", "wʊd", "v. will 的过去式", "past of will", "v", 5, 1, "zk gk cet4", ""],
  ["write", "raɪt", "v. 写", "to mark letters/words", "v", 5, 1, "zk gk cet4", "s:writes/d:wrote/i:writing/0:written"],
  ["year", "jɪə", "n. 年", "a period of 365 days", "n", 5, 1, "zk gk cet4", "s:years"],
  ["yes", "jes", "adv. 是；对", "affirmative response", "adv", 5, 1, "zk gk cet4", ""],
  ["you", "juː", "pron. 你；你们", "the person being addressed", "pron", 5, 1, "zk gk cet4", ""],
  ["your", "jɔː", "pron. 你的；你们的", "belonging to you", "pron", 5, 1, "zk gk cet4", ""],
  ["dictionary", "ˈdɪkʃənri", "n. 词典", "a book of word meanings", "n", 4, 1, "cet4", "s:dictionaries"],
  ["selection", "sɪˈlekʃn", "n. 选择；选段", "the act of selecting", "n", 3, 0, "cet6", "s:selections"],
  ["offline", "ˌɒfˈlaɪn", "adj./adv. 离线的", "not connected to a network", "adj/adv", 2, 0, "cet6", ""],
  ["launcher", "ˈlɔːntʃə", "n. 启动器；发射器", "a device that launches", "n", 1, 0, "", "s:launchers"]
];

function parseArgs(argv) {
  const csvIndex = argv.indexOf("--csv");
  return {
    csvPath:
      csvIndex >= 0 && argv[csvIndex + 1]
        ? path.resolve(argv[csvIndex + 1])
        : fs.existsSync(DEFAULT_CSV)
          ? path.resolve(DEFAULT_CSV)
          : null
  };
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

const SINGLE_WORD_RE = /^[a-z][a-z'-]*$/;
const PHRASE_RE = /^[a-z][a-z' -]*$/;

/** Keep English definition only for common words to control DB size. */
function isCommonEnoughForDefinition(tag, collins, oxford, frq) {
  const tagText = String(tag || "").toLowerCase();
  if (/(zk|gk|cet4|cet6|ky|toefl|ielts|gre|oxford)/.test(tagText)) {
    return true;
  }
  if (Number(collins) > 0 || Number(oxford) > 0) {
    return true;
  }
  return Number(frq) > 0 && Number(frq) <= 30000;
}

function loadRowsFromCsv(csvPath) {
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line || i === 0 && line.toLowerCase().startsWith("word,")) {
      continue;
    }
    const cells = parseCsvLine(line);
    if (cells.length < 10) {
      continue;
    }
    const [
      word,
      phonetic,
      definition,
      translation,
      pos,
      collins,
      oxford,
      tag,
      bnc,
      frq,
      exchange
    ] = cells;
    const normalized = String(word || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const isSingle = SINGLE_WORD_RE.test(normalized);
    const isPhrase = !isSingle && normalized.includes(" ") && PHRASE_RE.test(normalized);
    if (!isSingle && !isPhrase) {
      continue;
    }
    const translationText = String(translation || "").trim();
    if (!translationText) {
      continue;
    }
    const definitionText = isCommonEnoughForDefinition(tag, collins, oxford, frq)
      ? String(definition || "").trim()
      : "";
    rows.push([
      normalized,
      String(phonetic || "").trim(),
      definitionText,
      translationText,
      String(pos || "").trim(),
      Number(collins) || 0,
      Number(oxford) || 0,
      String(tag || "").trim(),
      String(exchange || "").trim()
    ]);
  }
  return rows;
}

function writeDatabase(rows) {
  fs.mkdirSync(path.dirname(OUT_DB), { recursive: true });
  if (fs.existsSync(OUT_DB)) {
    fs.unlinkSync(OUT_DB);
  }

  const db = new DatabaseSync(OUT_DB);
  db.exec(`
    PRAGMA journal_mode = OFF;
    CREATE TABLE entries (
      word TEXT PRIMARY KEY,
      phonetic TEXT,
      definition TEXT,
      translation TEXT,
      pos TEXT,
      collins INTEGER,
      oxford INTEGER,
      tag TEXT,
      exchange TEXT
    );
    CREATE INDEX idx_entries_word ON entries(word);
  `);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO entries
      (word, phonetic, definition, translation, pos, collins, oxford, tag, exchange)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN");
  for (const row of rows) {
    insert.run(...row);
  }
  db.exec("COMMIT");
  // FTS reverse-lookup index is applied at package/build time via
  // scripts/patch-ecdict-fts.cjs so the committed src/assets/ecdict.db
  // stays under GitHub's 100MB limit (~88MB).
  db.close();
}

function main() {
  const { csvPath } = parseArgs(process.argv.slice(2));
  let rows;
  let source;
  if (csvPath) {
    if (!fs.existsSync(csvPath)) {
      console.error(`[build-ecdict-db] CSV not found: ${csvPath}`);
      process.exit(1);
    }
    rows = loadRowsFromCsv(csvPath);
    source = csvPath;
  } else {
    rows = SEED_ROWS.map((row) => [
      row[0].toLowerCase(),
      row[1],
      row[3],
      row[2],
      row[4],
      row[5],
      row[6],
      row[7],
      row[8]
    ]);
    source = "embedded-seed";
  }

  writeDatabase(rows);
  const sizeKb = Math.round(fs.statSync(OUT_DB).size / 1024);
  console.log(
    `[build-ecdict-db] wrote ${OUT_DB} (${rows.length} entries, ${sizeKb} KB) from ${source}`
  );
}

main();
