---
title: reduce妙用
description: reduce
aside: false
date: 2023-3-07
tags:
  - ES6
---

## 前言

reduce 是 JavaScript 数组对象上的一个高阶函数，它可以用来迭代数组中的所有元素，并返回一个单一的值。其常用的语法为：

```js
array.reduce(callback[, initialValue])
```

其中，callback 是一个回调函数，它接受四个参数：累加器（初始值或上一次回调函数的返回值）、当前元素、当前索引、操作的数组本身。initialValue 是一个可选的初始值，如果提供了该值，则作为累加器的初始值，否则累加器的初始值为数组的第一个元素。
reduce 函数会从数组的第一个元素开始，依次对数组中的每个元素执行回调函数。回调函数的返回值将成为下一次回调函数的第一个参数（累加器）。最后，reduce 函数返回最终的累加结果。以下是一个简单的 reduce 示例，用于计算数组中所有元素的和：

```js
const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce(
  (accumulator, currentValue) => accumulator + currentValue
);
console.log(sum); // 15
```

在上面的代码中，reduce 函数从数组的第一个元素开始，计算累加值，返回最终的累加结果 15。
除了数组的求和，reduce 函数还可以用于其他各种用途，如数组求平均数、最大值、最小值等。此外，reduce 函数还可以与 map、filter、forEach 等函数组合使用，实现更加复杂的数据操作。

当然，以下是一些 reduce 的实际应用案例，帮助你更好地理解它的用法：

### 计算数组的平均数

```js
const arr = [1, 2, 3, 4, 5];
const average = arr.reduce((accumulator, currentValue, index, array) => {
  accumulator += currentValue;
  if (index === array.length - 1) {
    return accumulator / array.length;
  } else {
    return accumulator;
  }
});
console.log(average); // 3
```

### 求数组的最大值

```js
const arr = [1, 2, 3, 4, 5];
const max = arr.reduce((accumulator, currentValue) =>
  Math.max(accumulator, currentValue)
);
console.log(max); // 5
```

### 求数组的最小值

```js
const arr = [1, 2, 3, 4, 5];
const min = arr.reduce((accumulator, currentValue) =>
  Math.min(accumulator, currentValue)
);
console.log(min); // 1
```

### 数组去重

```js
const arr = [1, 2, 3, 3, 4, 4, 5];
const uniqueArr = arr.reduce((accumulator, currentValue) => {
  if (!accumulator.includes(currentValue)) {
    accumulator.push(currentValue);
  }
  return accumulator;
}, []);
console.log(uniqueArr); // [1, 2, 3, 4, 5]
```

### 计算数组中每个元素出现的次数

```js
const arr = [1, 2, 3, 3, 4, 4, 5];
const countMap = arr.reduce((accumulator, currentValue) => {
  if (!accumulator[currentValue]) {
    accumulator[currentValue] = 1;
  } else {
    accumulator[currentValue]++;
  }
  return accumulator;
}, {});
console.log(countMap); // {1: 1, 2: 1, 3: 2, 4: 2, 5: 1}
```

### 实现数组分组

```js
const arr = [1, 2, 3, 4, 5];
const result = arr.reduce(
  (accumulator, currentValue) => {
    if (currentValue % 2 === 0) {
      accumulator.even.push(currentValue);
    } else {
      accumulator.odd.push(currentValue);
    }
    return accumulator;
  },
  { even: [], odd: [] }
);
console.log(result); // {even: [2, 4], odd: [1, 3, 5]}
```

### 计算数组中连续递增数字的长度

```js
const arr = [1, 2, 3, 5, 6, 7, 8, 9];
const result = arr.reduce((accumulator, currentValue, index, array) => {
  if (index === 0 || currentValue !== array[index - 1] + 1) {
    accumulator.push([currentValue]);
  } else {
    accumulator[accumulator.length - 1].push(currentValue);
  }
  return accumulator;
}, []);
const maxLength = result.reduce(
  (accumulator, currentValue) => Math.max(accumulator, currentValue.length),
  0
);
console.log(maxLength); // 5
```

### 计算对象数组的属性总和

```js
const arr = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 35 },
];
const result = arr.reduce(
  (accumulator, currentValue) => accumulator + currentValue.age,
  0
);
console.log(result); // 90
```

### 将对象数组转换为键值对对象

```js
const arr = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 35 },
];
const result = arr.reduce((accumulator, currentValue) => {
  accumulator[currentValue.name] = currentValue.age;
  return accumulator;
}, {});
console.log(result); // {Alice: 25, Bob: 30, Charlie: 35}
```

### 计算数组中出现次数最多的元素

```js
const arr = [1, 2, 3, 4, 4, 4, 5, 5, 6, 6, 6, 6];
const result = arr.reduce((accumulator, currentValue) => {
  accumulator[currentValue] = (accumulator[currentValue] || 0) + 1;
  return accumulator;
}, {});
const maxCount = Math.max(...Object.values(result));
const mostFrequent = Object.keys(result)
  .filter((key) => result[key] === maxCount)
  .map(Number);
console.log(mostFrequent); // [6]
```

### 实现 Promise 串行执行

```js
javascript 复制代码 const promise1 = () => Promise.resolve('one');
const promise2 = (input) => Promise.resolve(input + ' two');
const promise3 = (input) => Promise.resolve(input + ' three');

const promises = [promise1, promise2, promise3];
const result = promises.reduce((accumulator, currentValue) => {
return accumulator.then(currentValue);
}, Promise.resolve('start'));
result.then(console.log); // 'one two three'
```

### 对象属性值求和

```js
const obj = {
  a: 1,
  b: 2,
  c: 3,
};
const result = Object.values(obj).reduce(
  (accumulator, currentValue) => accumulator + currentValue
);
console.log(result); // 6
```

### 按属性对数组分组

```js
const arr = [
{ id: 1, name: 'John' },
{ id: 2, name: 'Mary' },
{ id: 3, name: 'Bob' },
{ id: 4, name: 'Mary' }
];
const result = arr.reduce((accumulator, currentValue) => {
const key = currentValue.name;
if (!accumulator[key]) {
accumulator[key] = [];
}
accumulator[key].push(currentValue);
return accumulator;
}, {});
console.log(result);

{
  John: [{ id: 1, name: 'John' }],
  Mary: [
    { id: 2, name: 'Mary' },
    { id: 4, name: 'Mary' }
  ],
  Bob: [{ id: 3, name: 'Bob' }]
}
```

### 扁平化数组

```js
// 如果你有一个嵌套的数组，可以使用 reduce 将其扁平化成一个一维数组。例如：
const nestedArray = [
  [1, 2],
  [3, 4],
  [5, 6],
];
const flattenedArray = nestedArray.reduce((acc, curr) => acc.concat(curr), []);
console.log(flattenedArray); // [1, 2, 3, 4, 5, 6]
```

### 合并对象

```js
// 可以使用 reduce 将多个对象合并成一个对象。例如：
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const obj3 = { e: 5, f: 6 };
const mergedObj = [obj1, obj2, obj3].reduce(
  (acc, curr) => Object.assign(acc, curr),
  {}
);
console.log(mergedObj); // {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6}
```
