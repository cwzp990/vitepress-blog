export default {
  title: "桔子的前端小屋", // 网站标题
  description: "fe/blog/vue/react", //网站描述
  ignoreDeadLinks: true, // 最好加上，构建时会忽略md中的外链
  markdown: {
    // theme: "material-palenight", //md主题
    lineNumbers: true, //md 加行号
  },
  lastUpdated: true, //显示最近更新时间
  appearance: true, //可以选择深浅主题

  // 主题配置
  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "源码系列", link: "/code/" },
      { text: "笔记随想", link: "/note/" },
      { text: "工作总结", link: "/daily/" },
      { text: "关于我", link: "/me/" },
    ],
    socialLinks: [
      //右上角图标和链接，icon 可用svg 配置
      {
        icon: "github",
        link: "https://github.com/cwzp990",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2022-10-20～present cwzp990",
    },
    lastUpdatedText: "更新时间",
    siteTitle: "桔子的前端小屋",
    nav: [
      //右侧导航
      { text: "首页", link: "/" },
    ],
    // 侧边导航
    sidebar: {
      "/code/": [
        {
          text: "源码阅读",
          items: [],
        },
      ],
      "/note/": [
        {
          text: "笔记记录",
          items: [],
        },
      ],
      "/daily/": [
        {
          text: "日常工作总结",
          items: [],
        },
      ],
    },
    outlineTitle: "目录",
  },
};
