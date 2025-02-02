import { DEVA_CHAR_TYPES } from "./deva-char-types";

export enum AksharaType {
  AK = "akshara",
  SY = "symbol",
  OT = "other",
  IN = "invalid",
  WD = "words",
  WF = "wordfreq",
  CF = "charfreq"
}

export interface Akshara {
  value: string;
  type: AksharaType;
  varnas: number;
}

const CharType = {
  VO: ["vowels"],
  SY: ["symbols"],
  MA: ["vowel_marks", "yogavaahas", "accents"],
  VI: ["virama"],
  NP: ["zwnj", "zwj"],
  CO: ["consonants", "extra_consonants"],
  ND: ["non_deva_chars"],
  ES: ["end_of_string"],
};

const getCharType = (char: string): string => {
  if (char === undefined) return CharType.ES[0];

  return DEVA_CHAR_TYPES[char] ?? CharType.ND[0];
};

export const getAksharas = (str: string): Akshara[] => {
  const aksharas: Akshara[] = [];

  if (str.length === 0) return aksharas;

  const firstChar = str[0];
  const firstCharType = getCharType(str[0]);
  type chars = {[key: string]: number};
  let charFreqMap: chars = {};

  let acc: string = "";
  let varnas: number = 0;
  let isCollectingConjunct: boolean = false;
  let type: AksharaType = AksharaType.OT;

  if ([...CharType.VO].includes(firstCharType)) {
    aksharas.push({ value: firstChar, type: AksharaType.AK, varnas: 1 });
  }

  if ([...CharType.SY].includes(firstCharType)) {
    aksharas.push({ value: firstChar, type: AksharaType.SY, varnas });
  }

  if ([...CharType.ND].includes(firstCharType)) {
    aksharas.push({ value: firstChar, type: AksharaType.OT, varnas });
  }

  if (
    [...CharType.MA, ...CharType.VI, ...CharType.NP].includes(firstCharType)
  ) {
    aksharas.push({ value: firstChar, type: AksharaType.IN, varnas });
  }

  if ([...CharType.CO].includes(firstCharType)) {
    acc += firstChar;
    varnas += 2;
    type = AksharaType.AK;
  }

  charFreqMap[firstChar] = 1
  for (let i = 0, l = str.length - 1; i <= l; i += 1) {
    const nextChar = str[i + 1];
    const nextCharType = getCharType(nextChar);

    if (nextChar != " " && nextCharType != CharType.ES[0] ) {
      charFreqMap[nextChar] = charFreqMap[nextChar] ? charFreqMap[nextChar] + 1 : 1;
    }

    if ([...CharType.ES].includes(nextCharType)) {
      isCollectingConjunct = false;
      if (acc) aksharas.push({ value: acc, type, varnas });
      acc = "";
      varnas = 0;
      continue;
    }

    if ([...CharType.VO].includes(nextCharType)) {
      isCollectingConjunct = false;
      if (acc) aksharas.push({ value: acc, type, varnas });
      acc = nextChar;
      varnas = 1;
      type = AksharaType.AK;
      continue;
    }

    if ([...CharType.SY].includes(nextCharType)) {
      isCollectingConjunct = false;
      if (acc) aksharas.push({ value: acc, type, varnas });
      acc = nextChar;
      varnas = 0;
      type = AksharaType.SY;
      continue;
    }

    if ([...CharType.ND].includes(nextCharType)) {
      isCollectingConjunct = false;
      if (acc) aksharas.push({ value: acc, type, varnas });
      acc = nextChar;
      varnas = 0;
      type = AksharaType.OT;
      continue;
    }

    if ([...CharType.MA].includes(nextCharType)) {
      isCollectingConjunct = false;
      acc += nextChar;
      continue;
    }

    if ([...CharType.NP].includes(nextCharType)) {
      acc += nextChar;
      continue;
    }

    if ([...CharType.VI].includes(nextCharType)) {
      isCollectingConjunct = true;
      acc += nextChar;
      varnas -= 1;
      continue;
    }

    if ([...CharType.CO].includes(nextCharType)) {
      if (!isCollectingConjunct) {
        if (acc) aksharas.push({ value: acc, type, varnas });
        acc = nextChar;
        varnas = 0;
      } else {
        isCollectingConjunct = false;
        acc += nextChar;
      }

      varnas += 2;

      type = AksharaType.AK;

      continue;
    }
  }

  // Word count & Word frequency
  let wordCount = 0;
  // let words = str.replace(/[\t\n\r\.\?\!]/gm, " ").split(/\s/)
  let words = str.replace(/[\t\n\r\.\?\!]/gm, " ").split(/\s/)
  type wordfreq = {[key: string]: number};
  var wordfreqMap: wordfreq = {};

  words.map((s) => {
    let trimStr = s.trim();
    if (trimStr.length > 0) {
      wordCount ++
      if (!wordfreqMap[s]) {
        wordfreqMap[s] = 0;
      }
      wordfreqMap[s] += 1;
      aksharas.push({ value: wordCount +"", type: AksharaType.WD, varnas: 0 });
    }
  });

  //Word frequency
  Object.keys(wordfreqMap).sort().forEach(function(word) {
    aksharas.push({ value: word + ":" + wordfreqMap[word], type: AksharaType.WF, varnas: 0 });
  });

  //Character Frequency
  Object.keys(charFreqMap).sort().forEach(function(char) {
    aksharas.push({ value: char + ":" + charFreqMap[char], type: AksharaType.CF, varnas: 0 });
  });

  return aksharas;
};
