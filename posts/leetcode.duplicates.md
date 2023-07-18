---
title: 删除数组重复项
description: leetcode
aside: false
date: 2023-5-23
tags:
  - leetcode
---

### 前言

最近面试有一道题，实现数组去除重复项再求和，我一开始以为是数组去重，但是面试官说是删除，对于这个从不刷 leetcode 的我，只能暴力解，面试结束之后发现有更好的解决方案。

### leetcode

给你一个 升序排列 的数组 nums ，请你 原地 删除重复出现的元素，使每个元素 只出现一次 ，返回删除后数组的新长度。元素的 相对顺序 应该保持 一致 。然后返回 nums 中唯一元素的个数。

考虑 nums 的唯一元素的数量为 k ，你需要做以下事情确保你的题解可以被通过：

- 更改数组 nums ，使 nums 的前 k 个元素包含唯一元素，并按照它们最初在 nums 中出现的顺序排列。nums 的其余元素与 nums 的大小不重要。

- 返回 k 。

**判题标准:**

系统会用下面的代码来测试你的题解:

```js
int[] nums = [...]; // 输入数组
int[] expectedNums = [...]; // 长度正确的期望答案

int k = removeDuplicates(nums); // 调用

assert k == expectedNums.length;
for (int i = 0; i < k; i++) {
    assert nums[i] == expectedNums[i];
}
```

**示例 1：**

```
输入：nums = [1,1,2]
输出：2, nums = [1,2,_]
解释：函数应该返回新的长度 2 ，并且原数组 nums 的前两个元素被修改为 1, 2 。不需要考虑数组中超出新长度后面的元素。
```

**示例 2：**

```
输入：nums = [0,0,1,1,1,2,2,3,3,4]
输出：5, nums = [0,1,2,3,4]
解释：函数应该返回新的长度 5 ， 并且原数组 nums 的前五个元素被修改为 0, 1, 2, 3, 4 。不需要考虑数组中超出新长度后面的元素。
```

**提示：**

```
1 <= nums.length <= 3 \* 104
-104 <= nums[i] <= 104
nums 已按 升序 排列
```

### 算法分析

> 该方案利用双指针的方式，定义两个指针(low 初值 0,fast 初值 1)，当两指针所指元素相同时，将 fast 指针继续向右移动直至遇到不同元素时(此时 low 与 fast 则会拉开一个区间，该区间的元素则为需要删除的相同的元素)，将 low 指针向右移动一位，并将其赋值为 fast 指针所指元素(此时 0 到 low 指针所在区间的元素则是不重复的元素)，当 fast 指针超出数组范围则终止循环，此时 low 位置+1 则为去重后数组长度。

```js
/*
 * @description: 双指针   TC:O(n)  SC:O(1)
 * @param {*} nums 输入数组
 * @return {*}
 */
function doublePoint(nums) {
  // 如果数组长度不大于1，无需去重直接返回即可
  if (nums.length <= 1) return nums.length;
  // 定义两个指针
  let fastPoint = 1,
    lowPoint = 0;
  // 当fast指针超出数组范围则终止循环
  while (fastPoint < nums.length) {
    // 当两指针所指元素不同
    if (nums[lowPoint] != nums[fastPoint]) {
      // 将low指针向右移动一位
      lowPoint++;
      // 并将其赋值为fast指针所指元素
      nums[lowPoint] = nums[fastPoint];
    }
    // 继续移动fast指针
    fastPoint++;
  }
  return lowPoint + 1;
}
```
