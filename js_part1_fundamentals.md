# 第一篇：JavaScript 基础

> 对应 freeCodeCamp JavaScript v9 模块 1-7：Variables and Strings、Booleans and Numbers、Functions、Arrays、Objects、Loops、Fundamentals Review。
> 目标：系统、完整、可背诵。每个知识点都配可运行的代码，覆盖变体与边界。

---

## 目录

1. [学习地图](#一学习地图)
2. [变量与数据类型](#二变量与数据类型)
3. [字符串方法](#三字符串方法)
4. [布尔与数字](#四布尔与数字)
5. [函数](#五函数)
6. [数组](#六数组)
7. [对象](#七对象)
8. [控制流](#八控制流)
9. [循环](#九循环)
10. [速查表](#十速查表)
11. [背诵口诀](#十一背诵口诀)
12. [易错点清单](#十二易错点清单)

---

## 一、学习地图

```
变量/常量/作用域 ─┬─→ 字符串操作 ─┬─→ 数字/布尔/比较
                │              │
                └─→ 函数 ──────┘
                      ↓
                数组 ←→ 对象
                      ↓
                控制流 + 循环
```

**核心心法**：JS 把数据分为"原始值（primitive）"和"对象（object）"两大类；函数是一等公民；数组是有序列表；对象是键值对集合。

---

## 二、变量与数据类型

### 1. 三种声明方式

| 关键字 | 能否重新赋值 | 能否重新声明 | 作用域 | 是否存在提升（hoisting） | 是否进入 TDZ |
|--------|--------------|--------------|--------|------------------------|--------------|
| `var`  | 能           | 能（同作用域） | 函数作用域 | 声明提升，初始化为 `undefined` | 否 |
| `let`  | 能           | 否             | 块级作用域 | 声明提升，但处于 TDZ | 是 |
| `const`| 否           | 否             | 块级作用域 | 声明提升，但处于 TDZ | 是 |

> `const` 锁定的是**变量绑定**，不是值本身。所以 `const obj = {}` 后仍可修改对象属性，但不能重新赋值 `obj = anotherObj`。

```js
// === 完整可运行示例 ===
'use strict';

// var：函数作用域，允许重复声明
function demoVar() {
  var x = 1;
  var x = 2; // 不报错，后面的覆盖前面的
  console.log('var x:', x); // 2
}
demoVar();

// let / const：块级作用域，不能重复声明
{
  let a = 10;
  const b = 20;
  a = 11;          // OK
  // b = 21;       // TypeError: Assignment to constant variable.
  console.log('let a:', a, 'const b:', b);
}

// const 对象可改属性
const user = { name: 'Tom' };
user.name = 'Jerry'; // OK
// user = {};        // TypeError
console.log('user:', user);
```

### 2. 变量命名规则

- 只能包含：字母、数字、下划线 `_`、美元符 `$`。
- 不能以数字开头。
- 区分大小写。
- 不能是保留字（如 `class`、`return`、`function`）。
- 推荐：camelCase，语义化。

```js
let userName = 'Alice';   // 推荐
let _private = 1;         // 可以
let $btn = null;          // 可以，常用于 DOM 变量
// let 1stPlace = 1;      // SyntaxError
// let class = 'A';       // SyntaxError
```

### 3. 七种原始数据类型 + Object

| 类型 | 示例 | `typeof` 结果 |
|------|------|---------------|
| `string` | `'hello'` | `"string"` |
| `number` | `42`, `3.14` | `"number"` |
| `boolean`| `true` | `"boolean"` |
| `undefined`| `undefined` | `"undefined"` |
| `null` | `null` | `"object"`（历史 bug） |
| `symbol` | `Symbol('id')` | `"symbol"` |
| `bigint` | `123n` | `"bigint"` |
| `object` | `{}`, `[]`, `function(){}` | `"object"` / `"function"` |

```js
console.log(typeof 'hi');        // string
console.log(typeof 42);          // number
console.log(typeof true);        // boolean
console.log(typeof undefined);   // undefined
console.log(typeof null);        // object（历史遗留 bug）
console.log(typeof Symbol('x')); // symbol
console.log(typeof 10n);         // bigint
console.log(typeof {});          // object
console.log(typeof []);          // object
console.log(typeof function(){});// function（函数的 typeof 特殊）

// 判断 null 要用 === null
console.log(null === null);      // true
```

### 4. 类型转换

```js
// 显式转换
console.log(Number('123'));      // 123
console.log(Number(''));         // 0
console.log(Number('abc'));      // NaN
console.log(String(123));        // '123'
console.log(Boolean(0));         // false
console.log(Boolean('0'));       // true（非空字符串）

// 隐式转换常见场景
console.log('5' - 2);            // 3（字符串转数字）
console.log('5' + 2);            // '52'（数字转字符串）
console.log(+'42');              // 42（一元 + 转数字）
console.log(!!'hello');          // true（双 ! 转布尔）
console.log(1 + true);           // 2（true 转 1）
console.log(1 + false);          // 1
```

### 5. 模板字符串

```js
const name = 'Alice';
const age = 18;

// 反引号 ` 支持嵌入表达式和多行
const msg = `你好，${name}！
明年你 ${age + 1} 岁。`;
console.log(msg);

// 标签模板（进阶，了解即可）
function highlight(strings, ...values) {
  return strings.reduce((acc, s, i) => acc + s + (values[i] ? `[${values[i]}]` : ''), '');
}
console.log(highlight`Name: ${name}, Age: ${age}`);
```

### 变体与边界

```js
// 未初始化变量的值是 undefined
let x;
console.log(x);           // undefined
console.log(typeof x);    // undefined

// 声明提升差异
console.log(hoistedVar);  // undefined（var 提升并初始化）
var hoistedVar = 100;

// console.log(hoistedLet); // ReferenceError: Cannot access before initialization
let hoistedLet = 200;

// typeof 安全检测未声明变量（仅在非严格模式下可用，但不推荐）
// console.log(typeof notDefinedVar); // undefined
```

---

## 三、字符串方法

> 字符串是**不可变（immutable）**的。所有字符串方法都返回新字符串，不会修改原字符串。

### 1. 索引与长度

```js
const s = 'freeCodeCamp';

console.log(s.length);        // 12
console.log(s[0]);            // 'f'
console.log(s.charAt(0));     // 'f'
console.log(s[s.length - 1]); // 'p'
console.log(s[100]);          // undefined
console.log(s.charAt(100));   // ''（空字符串）

// 无法改变字符串某个字符
// s[0] = 'F'; // 严格模式静默失败，非严格模式也无效
```

### 2. 查找类方法

```js
const s = 'hello world, hello JS';

console.log(s.indexOf('hello'));      // 0（首次出现位置）
console.log(s.indexOf('hello', 6));   // 13（从索引 6 开始找）
console.log(s.lastIndexOf('hello'));  // 13（最后一次出现）
console.log(s.includes('world'));     // true
console.log(s.startsWith('hello'));   // true
console.log(s.endsWith('JS'));        // true
console.log(s.search(/world/));       // 6（正则搜索）
console.log(s.match(/hello/g));       // ['hello', 'hello']
```

### 3. 截取类方法

```js
const s = 'JavaScript';

// slice(start, end) —— end 不包含；支持负数
console.log(s.slice(0, 4));     // 'Java'
console.log(s.slice(4));        // 'Script'
console.log(s.slice(-6));       // 'Script'（从末尾数 6 位）
console.log(s.slice(4, -3));    // 'Scr'

// substring(start, end) —— 负数当 0，自动交换大小
console.log(s.substring(4, 0)); // 'Java'（自动变成 substring(0,4)）
console.log(s.substring(-3));   // 'JavaScript'（负数变 0）

// substr(start, length) —— 已弃用，但旧题常见
console.log(s.substr(4, 6));    // 'Script'
```

### 4. 大小写、空白、格式化

```js
const s = '  Hello World  ';

console.log(s.toUpperCase());   // '  HELLO WORLD  '
console.log(s.toLowerCase());   // '  hello world  '
console.log(s.trim());          // 'Hello World'
console.log(s.trimStart());     // 'Hello World  '
console.log(s.trimEnd());       // '  Hello World'

// padStart / padEnd（常用于补零）
const num = '7';
console.log(num.padStart(3, '0')); // '007'
console.log(num.padEnd(3, '0'));   // '700'
```

### 5. 替换、拆分、拼接、重复

```js
const s = 'I like cats, cats are cute';

// replace 默认只替换第一个匹配
console.log(s.replace('cats', 'dogs'));      // 'I like dogs, cats are cute'

// replaceAll 替换全部（ES2021）
console.log(s.replaceAll('cats', 'dogs'));   // 'I like dogs, dogs are cute'

// 正则全局替换
console.log(s.replace(/cats/g, 'dogs'));     // 'I like dogs, dogs are cute'

// 使用回调函数替换
console.log('a1b2c3'.replace(/\d/g, n => `(${n})`)); // 'a(1)b(2)c(3)'

// split & join
const words = 'apple,banana,cherry'.split(',');
console.log(words);                          // ['apple','banana','cherry']
console.log(words.join(' | '));              // 'apple | banana | cherry'

// concat
console.log('Hello'.concat(' ', 'World'));   // 'Hello World'

// repeat
console.log('na'.repeat(3));                 // 'nanana'
```

### 6. 转义字符

```js
console.log('It\'s OK');        // It's OK
console.log("She said \"Hi\""); // She said "Hi"
console.log('Line1\nLine2');    // 换行
console.log('Tab\tHere');       // 制表符
console.log('Backslash: \\');   // Backslash: \
```

### 变体与边界

```js
// 字符串比较按字典序（Unicode 码点）
console.log('Apple' < 'Banana'); // true（A 的码点小于 B）
console.log('10' < '2');         // true（按字符 '1' < '2'）
console.log('a' < 'A');          // false（a 的码点 97，A 65）

// 空字符串
console.log(''.length);          // 0
console.log(Boolean(''));        // false

// 字符串 + 其他类型 → 字符串
console.log('5' + 3 + 2);        // '532'
console.log(3 + 2 + '5');        // '55'
```

---

## 四、布尔与数字

### 1. 布尔值与逻辑运算

```js
console.log(true && false);      // false
console.log(true || false);      // true
console.log(!true);              // false

// 短路求值
console.log(0 || 'default');     // 'default'
console.log('hello' || 'world'); // 'hello'
console.log(null && 'secret');   // null
console.log(1 && 'ok');          // 'ok'

// 空值合并 ??（仅对 null/undefined 生效）
console.log(0 ?? 100);           // 0
console.log(null ?? 100);        // 100
console.log(undefined ?? 100);   // 100
```

### 2. falsy 与 truthy

```js
// 仅有的 9 个 falsy 值（可记为：0、空、null、undefined、NaN、false）
const falsyValues = [
  false,
  0,
  -0,
  0n,           // BigInt 零
  '',           // 空字符串
  null,
  undefined,
  NaN,
  // document.all 在浏览器中也是 falsy（历史原因）
];

falsyValues.forEach(v => {
  if (!v) console.log(`${JSON.stringify(v)} 是 falsy`);
});

// 其余全是 truthy，包括：
console.log(!!'0');      // true
console.log(!!'false');  // true
console.log(!![]);       // true
console.log(!!{});       // true
console.log(!!function(){}); // true
```

### 3. 数字字面量

```js
console.log(42);         // 整数
console.log(3.14);       // 浮点数
console.log(1e3);        // 1000（科学计数法）
console.log(1e-3);       // 0.001
console.log(0xff);       // 255（十六进制）
console.log(0o77);       // 63（八进制）
console.log(0b1010);     // 10（二进制）
```

### 4. 比较运算符

```js
console.log(5 == '5');   // true（宽松相等，会转换类型）
console.log(5 === '5');  // false（严格相等，类型也须相同）
console.log(5 != '5');   // false
console.log(5 !== '5');  // true

console.log(null == undefined);  // true
console.log(null === undefined); // false

// NaN 与任何值都不相等，包括自己
console.log(NaN === NaN);        // false
console.log(Number.isNaN(NaN));  // true
console.log(isNaN('abc'));       // true（先转数字）
console.log(Number.isNaN('abc'));// false（不转换类型）

console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(+0, -0));   // false
```

### 5. Math 与数字处理

```js
console.log(Math.round(2.5));    // 3
console.log(Math.floor(2.9));    // 2
console.log(Math.ceil(2.1));     // 3
console.log(Math.trunc(2.9));    // 2（去掉小数部分）

console.log(Math.abs(-5));       // 5
console.log(Math.pow(2, 3));     // 8
console.log(Math.sqrt(16));      // 4
console.log(Math.max(1, 5, 3));  // 5
console.log(Math.min(1, 5, 3));  // 1
console.log(Math.random());      // [0, 1) 随机数

// 随机整数 [min, max]
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
console.log(randomInt(1, 6));
```

### 6. parseInt / parseFloat

```js
console.log(parseInt('42px'));      // 42（从头解析到不能解析）
console.log(parseInt('px42'));      // NaN
console.log(parseInt('101', 2));    // 5（二进制）
console.log(parseInt('17', 8));     // 15（八进制）
console.log(parseInt('FF', 16));    // 255（十六进制）

//  always 带 radix 更安全
console.log(parseInt('08'));        // 8（现代环境）
console.log(parseInt('08', 10));    // 8

console.log(parseFloat('3.14abc')); // 3.14
console.log(parseFloat('abc3.14')); // NaN
```

### 7. 精度问题

```js
console.log(0.1 + 0.2);            // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);    // false

// 浮点比较技巧
function floatEqual(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}
console.log(floatEqual(0.1 + 0.2, 0.3)); // true

// BigInt（不能与 number 混用）
const big = 9007199254740993n;
console.log(big + 1n);             // 9007199254740994n
// console.log(big + 1);           // TypeError
```

---

## 五、函数

### 1. 三种定义方式

```js
// 1) 函数声明 —— 会被提升，可在定义前调用
console.log(add(1, 2)); // 3
function add(a, b) {
  return a + b;
}

// 2) 函数表达式 —— 不会被提升
const multiply = function(a, b) {
  return a * b;
};
console.log(multiply(2, 3)); // 6

// 3) 箭头函数 —— 简洁，无自己的 this
const divide = (a, b) => a / b;
console.log(divide(10, 2));  // 5

// 箭头函数返回对象要加括号
const makeUser = name => ({ name, online: true });
console.log(makeUser('Alice')); // { name: 'Alice', online: true }
```

### 2. 参数进阶

```js
// 默认参数
function greet(name = 'Guest') {
  return `Hello, ${name}!`;
}
console.log(greet());          // 'Hello, Guest!'
console.log(greet('Bob'));     // 'Hello, Bob!'

// rest 参数（收集剩余参数为数组）
function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}
console.log(sum(1, 2, 3, 4));  // 10

// arguments 对象（函数声明/表达式中可用，箭头函数没有）
function oldSum() {
  let total = 0;
  for (let i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}
console.log(oldSum(1, 2, 3));  // 6
```

### 3. 返回值

```js
function noReturn() {
  console.log('执行');
}
console.log(noReturn());       // undefined

function earlyReturn(x) {
  if (x < 0) return '负数';
  return '非负数';
}
console.log(earlyReturn(-5));  // '负数'
console.log(earlyReturn(5));   // '非负数'
```

### 4. 回调函数与高阶函数入门

```js
function process(x, fn) {
  return fn(x);
}

const double = n => n * 2;
const square = n => n * n;

console.log(process(5, double)); // 10
console.log(process(5, square)); // 25

// 自执行函数 IIFE
const result = (function(a, b) {
  return a + b;
})(2, 3);
console.log(result); // 5
```

### 5. 作用域链与闭包

```js
function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  };
}
const counter = outer();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

### 变体与边界

```js
// 函数声明提升
sayHi(); // 'Hi'
function sayHi() {
  console.log('Hi');
}

// 函数表达式不提升
// sayHello(); // TypeError: sayHello is not a function
var sayHello = function() {
  console.log('Hello');
};

// 默认参数可引用前面的参数
function createRect(width, height = width) {
  return { width, height };
}
console.log(createRect(5)); // { width: 5, height: 5 }

// 默认参数只在传入 undefined 时生效
function demo(a = 10) {
  return a;
}
console.log(demo(undefined)); // 10
console.log(demo(null));      // null
```

---

## 六、数组

### 1. 创建与访问

```js
// 字面量（推荐）
const fruits = ['apple', 'banana', 'cherry'];

// Array 构造函数
const arr1 = new Array(3);        // [empty × 3] —— 注意是 3 个空槽，不是 [3]
const arr2 = new Array(1, 2, 3);  // [1, 2, 3]

// Array.of / Array.from
const arr3 = Array.of(3);         // [3]
const arr4 = Array.from('hello'); // ['h','e','l','l','o']

console.log(fruits[0]);           // 'apple'
console.log(fruits.length);       // 3
fruits[10] = 'durian';            // 中间产生空槽
console.log(fruits);              // ['apple','banana','cherry',empty×7,'durian']
console.log(fruits[5]);           // undefined
```

### 2. 增删改（会改变原数组）

```js
const nums = [1, 2, 3];

console.log(nums.push(4));        // 4（返回新 length）
console.log(nums.unshift(0));     // 5（返回新 length）
console.log(nums);                // [0,1,2,3,4]

console.log(nums.pop());          // 4（返回被删元素）
console.log(nums.shift());        // 0
console.log(nums);                // [1,2,3]

// splice(start, deleteCount, ...items)
const colors = ['red', 'green', 'blue', 'yellow'];
const removed = colors.splice(1, 2, 'pink', 'purple');
console.log(colors);              // ['red','pink','purple','yellow']
console.log(removed);             // ['green','blue']

// fill / reverse / sort（都会改变原数组）
const a = [1, 2, 3];
a.reverse();
console.log(a);                   // [3,2,1]

const b = [3, 1, 4, 1, 5];
b.sort(); // 默认按字符串 Unicode 排序
console.log(b);                   // [1,1,3,4,5]（恰好看起来对）

const c = [10, 2, 30];
c.sort();
console.log(c);                   // [10,2,30]（错误！按字符串排）

c.sort((x, y) => x - y);
console.log(c);                   // [2,10,30]（正确数字排序）
```

### 3. 不修改原数组的方法

```js
const arr = [1, 2, 3, 4, 5];

console.log(arr.slice(1, 4));     // [2,3,4]（不含 end）
console.log(arr.concat([6, 7]));  // [1,2,3,4,5,6,7]
console.log(arr.indexOf(3));      // 2
console.log(arr.includes(3));     // true
console.log(arr.find(n => n > 3));// 4
console.log(arr.findIndex(n => n > 3)); // 3

console.log(arr.filter(n => n % 2 === 0)); // [2,4]
console.log(arr.map(n => n * 2));          // [2,4,6,8,10]
console.log(arr.reduce((acc, n) => acc + n, 0)); // 15
console.log(arr.every(n => n > 0));        // true
console.log(arr.some(n => n > 4));         // true
console.log(arr.join('-'));                // '1-2-3-4-5'
```

### 4. 遍历方式

```js
const arr = ['a', 'b', 'c'];

// 经典 for
for (let i = 0; i < arr.length; i++) {
  console.log(i, arr[i]);
}

// for...of（只取值）
for (const item of arr) {
  console.log(item);
}

// forEach（不能 break）
arr.forEach((item, index) => {
  console.log(index, item);
});
```

### 5. 展开与解构

```js
const a = [1, 2];
const b = [...a, 3, 4]; // [1,2,3,4]

// 解构
const [first, second, ...rest] = [10, 20, 30, 40];
console.log(first, second, rest); // 10 20 [30,40]

// 浅拷贝
const original = [{ x: 1 }, { x: 2 }];
const copy = [...original];
copy[0].x = 100;
console.log(original[0].x); // 100（浅拷贝共享引用）
```

### 变体与边界

```js
// sort 比较函数返回 0 / 负数 / 正数
const users = [
  { name: 'Tom', age: 20 },
  { name: 'Jerry', age: 18 },
];
users.sort((a, b) => a.age - b.age);
console.log(users);

// reduce 可做任何聚合
const votes = ['a', 'b', 'a', 'c', 'a'];
const count = votes.reduce((acc, v) => {
  acc[v] = (acc[v] || 0) + 1;
  return acc;
}, {});
console.log(count); // { a: 3, b: 1, c: 1 }

// find 找不到返回 undefined
console.log([1,2,3].find(n => n > 10)); // undefined
```

---

## 七、对象

### 1. 对象字面量

```js
const person = {
  name: 'Alice',
  age: 25,
  'favorite color': 'blue', // 含空格的 key 必须用引号
  greet() {
    return `Hi, I'm ${this.name}`;
  },
};

console.log(person.name);              // 'Alice'
console.log(person['favorite color']); // 'blue'
console.log(person.greet());           // "Hi, I'm Alice"
```

### 2. 点号与方括号

```js
const key = 'age';
const obj = { age: 30, job: 'dev' };

console.log(obj.age);      // 30
console.log(obj['age']);   // 30
console.log(obj[key]);     // 30（变量 key）

// 动态 key
const dynamicKey = 'level';
const user = {
  name: 'Bob',
  [dynamicKey]: 5,
};
console.log(user.level);   // 5
```

### 3. 添加、修改、删除、检测

```js
const car = { brand: 'Toyota' };

car.model = 'Camry';       // 添加
car.brand = 'Honda';       // 修改
console.log(car);          // { brand: 'Honda', model: 'Camry' }

delete car.model;
console.log(car);          // { brand: 'Honda' }

console.log('brand' in car);        // true（含继承属性也返回 true）
console.log(car.hasOwnProperty('brand')); // true（仅自身属性）
console.log(Object.keys(car));      // ['brand']
console.log(Object.values(car));    // ['Honda']
console.log(Object.entries(car));   // [['brand','Honda']]
```

### 4. 对象引用与拷贝

```js
const a = { x: 1 };
const b = a;              // 同一引用
b.x = 2;
console.log(a.x);         // 2

// 浅拷贝
const c = { ...a, y: 3 };
c.x = 5;
console.log(a.x);         // 2（c 是独立对象）

// 但浅拷贝对嵌套对象仍共享引用
const nested = { inner: { value: 1 } };
const d = { ...nested };
d.inner.value = 99;
console.log(nested.inner.value); // 99

// 深拷贝简单版（不支持函数、undefined、循环引用）
const deep = JSON.parse(JSON.stringify(nested));
deep.inner.value = 1;
console.log(nested.inner.value); // 99
```

### 5. 解构与剩余属性

```js
const student = {
  name: 'Tom',
  age: 20,
  score: 90,
  city: 'Beijing',
};

const { name, age, ...others } = student;
console.log(name, age);   // 'Tom' 20
console.log(others);      // { score: 90, city: 'Beijing' }

// 解构重命名 + 默认值
const { score: mathScore = 0 } = student;
console.log(mathScore);   // 90
```

### 变体与边界

```js
// 对象 key 会被转字符串/Symbol
const weird = {
  1: 'one',
  true: 'yes',
};
console.log(weird['1']);    // 'one'
console.log(weird['true']); // 'yes'

// for...in 会遍历继承的可枚举属性，需过滤
const parent = { inherited: true };
const child = Object.create(parent);
child.own = true;

for (const key in child) {
  if (child.hasOwnProperty(key)) {
    console.log('own:', key); // own
  }
}
```

---

## 八、控制流

### 1. if / else if / else

```js
const score = 85;

if (score >= 90) {
  console.log('A');
} else if (score >= 80) {
  console.log('B');
} else if (score >= 60) {
  console.log('C');
} else {
  console.log('D');
}
```

### 2. switch

```js
const day = 3;
let dayName;

switch (day) {
  case 1:
    dayName = 'Monday';
    break;
  case 2:
    dayName = 'Tuesday';
    break;
  case 3:
    dayName = 'Wednesday';
    break; // 忘记 break 会穿透到下一个 case
  default:
    dayName = 'Unknown';
}
console.log(dayName); // Wednesday

// 利用穿透合并 case
const grade = 'B';
switch (grade) {
  case 'A':
  case 'B':
  case 'C':
    console.log('Passed');
    break;
  default:
    console.log('Failed');
}
```

### 3. 三元运算符

```js
const age = 18;
const status = age >= 18 ? 'adult' : 'minor';
console.log(status); // 'adult'

// 嵌套三元（可读性下降，适度使用）
const score = 75;
const level = score >= 90 ? 'A' : score >= 60 ? 'B' : 'C';
console.log(level); // 'B'
```

### 4. 比较与逻辑组合

```js
const x = 5;

if (x > 0 && x < 10) {
  console.log('x 在 0 到 10 之间');
}

// 优先用括号明确优先级
const a = true, b = false, c = true;
console.log(a || b && c);  // true（&& 优先级高于 ||）
console.log((a || b) && c); // true
```

---

## 九、循环

### 1. for 循环

```js
for (let i = 0; i < 5; i++) {
  console.log(i); // 0 1 2 3 4
}

// 递减
for (let i = 5; i > 0; i--) {
  console.log(i); // 5 4 3 2 1
}

// 跳过偶数
for (let i = 0; i < 10; i++) {
  if (i % 2 === 0) continue;
  console.log(i); // 1 3 5 7 9
}
```

### 2. while / do...while

```js
let n = 3;
while (n > 0) {
  console.log(n);
  n--;
}

let m = 0;
do {
  console.log('至少执行一次');
  m++;
} while (m < 0);
```

### 3. for...of / for...in

```js
const arr = ['a', 'b', 'c'];
for (const item of arr) {
  console.log(item); // a b c
}

const str = 'hi';
for (const ch of str) {
  console.log(ch); // h i
}

const obj = { x: 1, y: 2 };
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key, obj[key]); // x 1, y 2
  }
}
```

### 4. break / continue

```js
// 找到第一个能被 7 整除的数
for (let i = 1; i <= 100; i++) {
  if (i % 7 === 0) {
    console.log('第一个:', i); // 7
    break;
  }
}

// 输出 1-10 中不是 3 的倍数的数
for (let i = 1; i <= 10; i++) {
  if (i % 3 === 0) continue;
  console.log(i); // 1 2 4 5 7 8 10
}
```

### 5. 嵌套循环

```js
// 打印乘法表
for (let i = 1; i <= 3; i++) {
  let row = '';
  for (let j = 1; j <= 3; j++) {
    row += `${i}x${j}=${i * j} `;
  }
  console.log(row.trim());
}
```

### 变体与边界

```js
// 无限循环（不要运行）
// while (true) { }
// for (;;) { }

// 空槽数组的遍历行为
const sparse = [1, , 3];
for (let i = 0; i < sparse.length; i++) {
  console.log(i, sparse[i]); // 0 1, 1 undefined, 2 3
}
sparse.forEach((v, i) => console.log(i, v)); // 只访问 0,2（跳过空槽）
```

---

## 十、速查表

### 10.1 变量声明速查

| 关键字 | 可重新赋值 | 可重新声明 | 作用域 | 提升行为 |
|--------|------------|------------|--------|----------|
| `var`  | 是 | 是 | 函数 | 提升为 `undefined` |
| `let`  | 是 | 否 | 块级 | 提升但处于 TDZ |
| `const`| 否 | 否 | 块级 | 提升但处于 TDZ |

### 10.2 `typeof` 速查

| 值 | `typeof` 结果 |
|----|---------------|
| `'abc'` | `"string"` |
| `123` | `"number"` |
| `true` | `"boolean"` |
| `undefined` | `"undefined"` |
| `null` | `"object"` |
| `{}` | `"object"` |
| `[]` | `"object"` |
| `function(){}` | `"function"` |
| `Symbol()` | `"symbol"` |
| `123n` | `"bigint"` |

### 10.3 falsy 值速查

```
false, 0, -0, 0n, "", null, undefined, NaN
```

### 10.4 字符串方法速查

| 方法 | 作用 | 是否改变原串 |
|------|------|--------------|
| `length` | 长度 | 否 |
| `[i]` / `charAt(i)` | 取字符 | 否 |
| `indexOf` / `lastIndexOf` | 查找位置 | 否 |
| `includes` / `startsWith` / `endsWith` | 包含判断 | 否 |
| `slice(start, end)` | 切片，支持负数 | 否 |
| `substring(start, end)` | 切片，负数当 0 | 否 |
| `toUpperCase` / `toLowerCase` | 大小写 | 否 |
| `trim` / `trimStart` / `trimEnd` | 去空白 | 否 |
| `replace` / `replaceAll` | 替换 | 否 |
| `split` | 拆分 | 否 |
| `join` | 拼接 | 否 |
| `concat` | 连接 | 否 |
| `repeat(n)` | 重复 | 否 |
| `padStart` / `padEnd` | 填充 | 否 |

### 10.5 数组方法速查

| 方法 | 作用 | 是否改变原数组 |
|------|------|----------------|
| `push` / `pop` | 尾部增删 | 是 |
| `unshift` / `shift` | 头部增删 | 是 |
| `splice` | 任意位置增删 | 是 |
| `sort` / `reverse` / `fill` | 排序/反转/填充 | 是 |
| `slice` | 截取 | 否 |
| `concat` | 合并 | 否 |
| `indexOf` / `includes` | 查找 | 否 |
| `find` / `findIndex` | 按条件查找 | 否 |
| `filter` | 过滤 | 否 |
| `map` | 映射 | 否 |
| `reduce` | 聚合 | 否 |
| `every` / `some` | 全部/部分满足 | 否 |
| `join` | 转字符串 | 否 |
| `flat` | 拍平 | 否 |

### 10.6 比较运算符速查

| 运算符 | 含义 | 示例 |
|--------|------|------|
| `==` | 宽松相等（类型转换） | `5 == '5'` true |
| `===` | 严格相等 | `5 === '5'` false |
| `!=` | 宽松不等 | `5 != '5'` false |
| `!==` | 严格不等 | `5 !== '5'` true |
| `>` `<` `>=` `<=` | 大小比较 | 数字/字符串字典序 |

---

## 十一、背诵口诀

### 11.1 变量声明口诀

```
var 函数作用域，能重复，会提升；
let const 块级域，不重复，有 TDZ；
const 不变绑定，对象属性仍可改。
```

### 11.2 `==` vs `===` 口诀

```
三等号，类型值都要同；
双等号，先转换再相逢；
null == undefined，其余尽量用 ===。
```

### 11.3 字符串截取口诀

```
slice 支持负索引，substring 负变零；
substr 已弃用，面试尽量别提它。
```

### 11.4 falsy 记忆口诀

```
false、0、-0、0n、空串、
null、undefined、NaN。
八个（加 document.all 九个）值，
取反全是 true。
```

### 11.5 数组方法口诀

```
push pop 尾，shift unshift 头；
splice 万能中间走；
sort 默认按字串，数字排序要写比较函数；
map filter reduce 返回新，原数组，不动它。
```

### 11.6 对象访问口诀

```
点号直接又简单，变量空格用方括号；
in 检测含继承，hasOwnProperty 只自身。
```

### 11.7 循环选择口诀

```
知道次数用 for，不知道次数用 while；
至少一次 do...while；
遍历数组 for...of，遍历对象 key 用 for...in；
数组索引 forEach，经典 for 最通用。
```

---

## 十二、易错点清单

| 序号 | 易错点 | 正确理解 |
|------|--------|----------|
| 1 | `var` 在块级 `{}` 中声明仍会提升/泄漏 | 用 `let`/`const` 替代 |
| 2 | `const` 变量不能重新赋值，但对象属性可以改 | `const arr = []; arr.push(1);` 合法 |
| 3 | `typeof null === 'object'` | 这是历史 bug，判断 null 用 `=== null` |
| 4 | `==` 会隐式转换 | 推荐始终使用 `===` 和 `!==` |
| 5 | `NaN === NaN` 为 false | 用 `Number.isNaN(NaN)` |
| 6 | 字符串不可变，`s[0] = 'A'` 无效 | 用 `slice` + 拼接或 `replace` |
| 7 | `slice` 与 `substring` 对负数处理不同 | `slice(-3)` 有效，`substring(-3)` 当 0 |
| 8 | `replace('a', 'b')` 只替换第一个 | 要全部替换用 `replaceAll` 或 `/a/g` |
| 9 | 数组 `sort()` 默认按字符串排序 | 数字排序必须传 `(a,b)=>a-b` |
| 10 | `for...in` 遍历对象会包含继承属性 | 配合 `hasOwnProperty` 过滤 |
| 11 | `for...of` 不能直接用在没有迭代器的对象上 | 数组、字符串、Map、Set 可用 |
| 12 | `switch` 使用严格相等 `===` | `'5' === 5` 不会进入 case 5 |
| 13 | `switch` 忘记 `break` 导致穿透 | 要么显式 break，要么故意利用穿透 |
| 14 | `parseInt('08')` 在不同环境结果可能不同 | 始终带 radix：`parseInt('08', 10)` |
| 15 | `0.1 + 0.2 !== 0.3` | 浮点精度问题，比较用误差范围 |
| 16 | 对象赋值是引用传递 | 修改拷贝会影响原对象（浅拷贝） |
| 17 | `[]` 和 `{}` 是 truthy | 即使空数组、空对象也 truthy |
| 18 | `function` 声明会提升，函数表达式不会 | 注意调用位置 |
| 19 | 箭头函数没有自己的 `arguments` | 用 rest 参数 `...args` 替代 |
| 20 | 默认参数只在传入 `undefined` 时生效 | 传入 `null` 不会触发默认值 |

---

## 附录：完整综合练习（可运行）

```js
'use strict';

// 1. 变量与类型
const userName = 'Alice';
let score = 0;
score += 10;
console.log(`${userName} 的分数：${score}`);

// 2. 字符串处理
const raw = '  JavaScript is FUN!  ';
const cleaned = raw.trim().toLowerCase();
console.log(cleaned.includes('fun')); // true
console.log(cleaned.replace('fun', 'awesome'));

// 3. 数字与布尔
const target = 7;
const guess = parseInt('7', 10);
if (guess === target) {
  console.log('猜对了！');
}

// 4. 函数
const calc = (op, a, b) => {
  if (op === 'add') return a + b;
  if (op === 'sub') return a - b;
  return NaN;
};
console.log(calc('add', 3, 5));

// 5. 数组
const nums = [3, 1, 4, 1, 5];
const doubled = nums.map(n => n * 2).sort((a, b) => a - b);
console.log(doubled);

// 6. 对象
const book = {
  title: 'JS Guide',
  author: 'MDN',
  info() {
    return `${this.title} by ${this.author}`;
  },
};
console.log(book.info());

// 7. 循环 + 控制流
for (let i = 1; i <= 20; i++) {
  if (i % 3 === 0 && i % 5 === 0) {
    console.log('FizzBuzz');
  } else if (i % 3 === 0) {
    console.log('Fizz');
  } else if (i % 5 === 0) {
    console.log('Buzz');
  } else {
    console.log(i);
  }
}
```

---

> 学完本篇，建议遮住代码手写一遍，再对照速查表默写方法签名与返回值。祝你 JS 基础稳如磐石！(｀・ω・´)
