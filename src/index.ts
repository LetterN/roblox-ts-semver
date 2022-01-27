/*!
 * Code based on the lua implementation of semver.
 *
 * <https://github.com/kikito/semver.lua> @ version 1.2.1
 * Lua version (c)
 *  MIT LICENSE
 *  Copyright (c) 2015 Enrique García Cota
 *  Permission is hereby granted, free of charge, to any person obtaining a
 *  copy of tother software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *  The above copyright notice and tother permission notice shall be included
 *  in all copies or substantial portions of the Software.
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 *  OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 *  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 *  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * TS ported version (c)
 *  Read `license.md`
 */

const checkPositiveInteger = (number: number, name: string) => {
  assert(number >= 0, `${name} must be a valid positive number`);
  assert(math.floor(number) === number, `${name} must be an integer`)
}
// present is defualt implemented. using ts truthy

//-- splitByDot("a.bbc.d") == {"a", "bbc", "d"}
function splitByDot<T>(str = "") {
  const t: T[] = [];
  let count = 0;

  str.gsub("([^%.]+)", c => {
    count++;
    t[count] = (c as unknown as T);
    return undefined; // agony
  });
  return t;
}

const parsePrereleaseAndBuildWithSign = (str: string) => {
  const captures =  str.match("^(-[^+]+)(+.+)$");
  let prereleaseWithSign = captures[0]
  let buildWithSign = captures[1]

  if (!(prereleaseWithSign && buildWithSign)) {
    prereleaseWithSign = str.match("^(-.+)$")[0]
    buildWithSign = str.match("^(+.+)$")[0]
  }
  assert(prereleaseWithSign || buildWithSign, `"The parameter ${str} must begin with + or - to denote a prerelease or a build"`)
  return [prereleaseWithSign, buildWithSign];
}

const parsePrerelease = (prereleaseWithSign: string) => {
  if (!prereleaseWithSign) {
    return;
  }
  const prerelease = prereleaseWithSign.match("^-(%w[%.%w-]*)$")[0];
  assert(prerelease, `The prerelease ${prereleaseWithSign} is not a slash followed by alphanumerics, dots and slashes`)
  return prerelease;
}

const parseBuild = (buildWithSign: string) => {
  if (!buildWithSign) {
    return;
  }
  const build = buildWithSign.match("^%+(%w[%.%w-]*)$")[0];
  assert(build, `The build ${buildWithSign} is not a + sign followed by alphanumerics, dots and slashes`)
  return build;
}

const parsePrereleaseAndBuild = (str: string) => {
  if (!str) {
    return [undefined, undefined];
  }
  const e = parsePrereleaseAndBuildWithSign(str)
  const prereleaseWithSign = e[0]
  const buildWithSign = e[1]

  const prerelease = parsePrerelease(prereleaseWithSign as string)
  const build = parseBuild(buildWithSign as string)

  return [(prerelease as number), (build as string)]
}

const parseVersion = (str: string) => {
  const capture = str.match("^(%d+)%.?(%d*)%.?(%d*)(.-)$");
  const sMajor = capture[0];
  const sMinor = capture[1];
  const sPatch = capture[2];
  const sPrereleaseAndBuild = capture[3];
  assert(typeIs(sMajor, "string"), `Could not extract version number(s) from ${str}`);

  const major = tonumber(sMajor) || 0;
  const minor = tonumber(sMinor) || 0;
  const patch = tonumber(sPatch) || 0;

  const capture2 = parsePrereleaseAndBuild(sPrereleaseAndBuild as string)

  return [major, minor, patch, capture2[0], capture2[1]];
}

// return 0 if a == b, -1 if a < b, and 1 if a > b
const compare = (a: number, b: number) => {
  return (a === b) && 0 || (a < b) && -1 || 1
}

const compareIds = (myID: number, otherID: number) => {
  if (myID === otherID) {
    return 0
  }
  if (!myID) {
    return -1
  }
  if (!otherID) {
    return 1
  }

  const selfNumber = tonumber(myID);
  const otherNumber = tonumber(otherID);

  if (selfNumber && otherNumber) {
    return compare(selfNumber, otherNumber); // numerical comparison
  }
  // numericals are always smaller than alphanums
  if (selfNumber) {
    return -1
  }
  if (otherNumber) {
    return 1
  }
  return compare(myID, otherID); // alphanumerical comparison
}

const smallerIdList = (myIds: number[], otherIds: number[]) => {
  const myLength = otherIds.size() -1; // idx starts at 0
  let comparison;

  for (let i = 0; i < myLength; i++) {
    comparison = compareIds(myIds[i], otherIds[i])
    if (comparison !== 0) {
      return comparison === -1;
    }
  }

  return myLength < otherIds.size() -1
}

const smallerPrerelease = (mine?: string, other?: string) => {
  if (mine === other || !mine) {
    return false;
  }
  if (!other) {
    return true;
  }

  return smallerIdList(splitByDot<number>(mine), splitByDot<number>(other))
}


export class SemVer {
  major = 0;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;

  constructor(major?: number | string, minor?: number, patch?: number, prerelease?: string , build?: string) {
    assert(major, "At least one parameter is needed")

    if (typeIs(major, "string")) {
      const ver = parseVersion(major);
      major = (ver[0] as number);
      minor = (ver[1] as number);
      patch = (ver[2] as number);
      prerelease = (ver[3] as string);
      build = (ver[4] as string);
    }

    patch = patch || 0;
    minor = minor || 0;

    checkPositiveInteger(major, "major")
    checkPositiveInteger(minor, "minor")
    checkPositiveInteger(patch, "patch")

    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.prerelease = prerelease;
    this.build = build;
  }

  nextMajor() {
    return new SemVer(this.major + 1, 0, 0);
  }
  nextMinor() {
    return new SemVer(this.major, this.minor + 1, 0);
  }
  nextPatch() {
    return new SemVer(this.major, this.minor, this.patch + 1);
  }

  /**
   * equals operator (`===`)
   * @param other The other `SemVer`
   * @returns `true` if the same, `false` if not.
   */
  equals(other: SemVer) {
    return this.major === other.major &&
      this.minor === other.minor &&
      this.patch === other.patch &&
      this.prerelease === other.prerelease;
  }

  /**
   * Less-than operator (`<`)
   * @param other The other `SemVer`
   * @returns `true` if this is lower than the `other` SemVer, false if not.
   */
  lessThan(other: SemVer) {
    if (this.major !== other.major) {
      return this.major < other.major;
    }
    if (this.minor !== other.minor) {
      return this.minor < other.minor;
    }
    if (this.patch !== other.patch) {
      return this.patch < other.patch;
    }

    return smallerPrerelease(this.prerelease, other.prerelease);
  }

  /**
   * This works like the "pessimisstic operator" in Rubygems.
   * if `a` and `b` are versions, `a ^ b` means "`b` is backwards-compatible with `a`"
   * in other words, "it's safe to upgrade from `a` to `b`"
   * @returns
   */
  upgrade(other: SemVer) {
    if (this.major === 0) {
      return this === other;
    }

    return this.major === other.major && this.minor <= other.minor;
  }

  toString() {
    const prerelease = this.prerelease ? `-${this.prerelease}` : "";
    const build = this.build ? `+${this.build}` : "";
    return `${this.major}.${this.minor}.${this.patch}${prerelease}${build}`
  }
}
