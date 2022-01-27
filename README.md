# @rbxts/semver

Implementation of [semver.lua](https://github.com/kikito/semver.lua) in `roblox-ts`.

## Usage

```ts
import { SemVer as semver } from "@rbxts/semver";

// two ways of creating it: with separate parameters, or with one string
const v1 = new semver(1, 0, 0);
const v2_5_1 = new semver("2.5.1")

// major, minor and patch attributes
v2_5_1.major // 2
v2_5_1.minor // 5
v2_5_1.patch // 1

// prereleases:
const a = new semver(1,0,0,'alpha');
a.prerelease // 'alpha'
const b = new semver('1.0.0-beta');
b.prerelease // 'beta'

// builds
const c = new semver(1,0,0, undefined,'build-1')
c.build // 'build-1'

const d = new semver('0.9.5+no.extensions.22')
d.build // 'no.extensions.22'

// comparison & sorting
new semver('1.2.3').equals(new semver(1,2,3))             // true
new semver('1.2.3').lessThan(new semver(4,5,6))           // true
new semver('1.2.3-alpha').lessThan(new semver('1.2.3'))   // true
new semver('1.2.3').lessThan(new semver('1.2.3+build.1')) // false, builds are ignored when comparing versions in semver

// "pessimistic upgrade" operator: ^
// a ^ b returns true if it's safe to update from a to b
new semver('2.0.1').upgrade(new semver('2.5.1')) // true - it's safe to upgrade from 2.0.1 to 2.5.1
new semver('1.0.0').upgrade(new semver('2.0.0')) // false - 2.0.0 is not supposed to be backwards-compatible
new semver('2.5.1').upgrade(new semver('2.0.1')) // false - 2.5.1 is more modern than 2.0.1.

// getting newer versions
new semver(1,0,0).nextPatch() // v1.0.1
new semver(1,2,3).nextMinor() // v1.3.0 . Notice the patch resets to 0
new semver(1,2,3).nextMajor() // v2.0.0 . Minor and patch are reset to 0
```
