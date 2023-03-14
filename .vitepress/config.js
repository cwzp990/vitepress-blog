import { getPosts, getPostLength } from "./theme/serverUtils";
import { buildBlogRSS } from "./theme/rss";

async function config() {
  return {
    lang: "en-US",
    title: "Juzi",
    description: "Home of Juzi",
    head: [
      [
        "link",
        {
          rel: "icon",
          type: "image/svg",
          href: "/icon.svg",
        },
      ],
      [
        "meta",
        {
          name: "author",
          content: "Juzi",
        },
      ],
      [
        "meta",
        {
          property: "og:title",
          content: "Home",
        },
      ],
      [
        "meta",
        {
          property: "og:description",
          content: "Home of Juzi",
        },
      ],
    ],
    lastUpdated: false,
    themeConfig: {
      logo: "/icon.svg",
      docsDir: "/",
      posts: await getPosts(),
      pageSize: 5,
      postLength: await getPostLength(),
      nav: [
        {
          text: "🏡Blogs",
          link: "/",
        },
        {
          text: "🔖Tags",
          link: "/tags",
        },
        {
          text: "📃Archives",
          link: "/archives",
        },
      ],
      socialLinks: [
        { icon: "github", link: "https://github.com/cwzp990" },
        {
          icon: {
            svg: `<svg t="1678761258150" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3553" width="200" height="200"><path d="M430.079734 481.464543c45.196365 45.596478 118.486578 45.596478 163.68499 0l360.684736-324.939627c0.547469 3.751441 1.13894 7.490601 1.13894 11.401678l0 404.753417 0 116.754121c0 42.995233-34.547841 77.838809-77.145008 77.838809L145.397996 767.272941c-42.597167 0-77.145008-34.844599-77.145008-77.838809L68.252988 494.839155 68.252988 167.926594c0-3.911076 0.593518-7.65126 1.139963-11.401678L430.079734 481.464543zM910.960992 74.226538 562.044278 387.28558c-38.470173 38.811957-62.276369 38.811957-100.770078 0L112.538611 74.408687c10.011005-4.789073 21.069875-7.673773 32.859385-7.673773l733.044372 0C890.095779 66.735937 901.065622 69.539796 910.960992 74.226538z" p-id="3554"></path></svg>`,
          },
          link: "mailto:cwzp990@gmail.com",
        },
      ],
    },
    buildEnd: buildBlogRSS,
  };
}
export default config();
