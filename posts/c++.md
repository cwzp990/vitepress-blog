---
title: C++
description: C++
aside: false
date: 2024-8-25
tags:
  - C++
---

## 前言

马上要参加c语言考试了，这里把一些考点梳理一下，希望能考一个好成绩。

## 数据类型

### 变量

### 常量

> 在C++中，常量被定义为不可修改的值。因此，直接修改常量的值是不允许的，这样做会导致编译错误。

```cpp

const int a = 20; // 常量
int b = 30; // 变量

```

在C++中，常量是不可修改的。如果您需要一个可以更改的值，请使用变量而不是常量。

### 函数的引用

在C++中，函数用是一种特殊类型的引用，它允许我们在函数中使用其他变量或对象的别名。通过函数引用，我们可以在函数内部直接操作原始变量，面无需进行值的复制。

要声明函数引用，需要在函数参数列表中使用引用符号 (&)来指示引用。函数引用在传递实参时会绑定到相应的变量或对象上，并成为该变量或对象的一个别名。对函数引用的操作会直接影响原始变量或对象。

```cpp

#include <iostream>

using namespace std;

void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5;
    int y = 10;

    cout << "x:" << x << endl;
    cout << "y:" << y << endl;

    swap(x, y);

    cout << "x:" << x << endl;
    cout << "y:" << y << endl;

    return 0;
}

```

### 指针与引用

指针需要使用`*`符号来声明和解引用，而引用则通过在声明时使用`&`符号进行定义。

```cpp
int x = 40;
int* ptr = &x; // 指针的声明和初始化
int& ref = x; // 引用的声明和初始化
```

俩者的区别：

- 指针可以为空 (nul)，即指向一个无效的地址。而引用必须在声明时绑定到有效的对象上，并且不能为nul。

- 指针可以被重新赋值以指向不同的对象。换句话说，指针可以改变其所指向的对象。而引用一旦绑定了一个对象，就不能再改变其绑定的对象，它始终引
用同一个对象。

- 指针本身需要占用内存空间来存储地址信息。而引用只是变量的别名，并没有自己的内存空间。

- 指针可以指向任意类型的对象(包括基本类型、数组、结构体、对象等)，也可以指向空类型void。而引用只能绑定到与其类型相同的对象。

- 指针可以在函数之间传递地址，以进行参数传递和返回。而引用通常用于函数参数传递或作为函数返回值，以提供对变量的直接访问方式，避免了指针传递中需要解引用的繁琐操作。

- 在32位系统上，指针的大小通常为4字节（32位），而在64位系统上，指针的大小通常为8字节（64位）。而引用实际上是对已存在变量的别名，并不会占用额外的内存空间。

```cpp
#include <iostream>

using namespace std;

void increment(int& num) {
    cout << "value of num:" << num << endl;
    cout << "address of num:" << &num << endl;
    num++;
}

int main() {
    int a = 10;
    cout << "address of a:" << &a << endl;
    cout << "before increment" << a << endl;
    increment(a);
    cout << "after increment" << a << endl;

    return 0;
}

/**
    address of a:0x7ffffacefd9c
    before increment10
    value of num:10
    address of num:0x7ffffacefd9c
    after increment11
 */
```

#### 例子

```cpp
#include <iostream>

using namespace std;

int main() {
    int x = 42;
    int y = 10;
    int* ptr = &x;
    int& ref = x;

    cout << "ptr存放的地址（变量x的内存地址）：" << ptr << endl;
    cout << "ptr存放的地址 所对应的值：" << *ptr << endl;
    cout << "ref对应的地址：" << &ref << endl;
    cout << "ref 所代表的值：" << ref << endl;

    ptr = &y;
    ref = y;

    return 0;
}

/**
    ptr存放的地址（变量x的内存地址）：0x7ffc2911016c
    ptr存放的地址 所对应的值：42
    ref对应的地址：0x7ffc2911016c
    ref 所代表的值：42
 */
```

#### 补充 const int* e 和 int* const e的区别

**前者强调指针所指向的内容应该是只读的，后者强调指针自身的值固定不变**

## 函数

### 函数重载
