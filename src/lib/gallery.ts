import type { AppLang } from "./lang";

type LocalizedText = Record<AppLang, string>;

export type Artwork = {
  id: string;
  thumbUrl: string;
  imageUrl: string;
  title: LocalizedText;
  author: LocalizedText;
};

export type GuestGallery = {
  id: "a" | "b";
  guestListPath: string;
  guestDetailPath: string;
  heading: LocalizedText;
  storyMapButton: LocalizedText;
  storyMapUrl: string;
  storyImageUrl: string;
  storyTitle: LocalizedText;
  storyDescription: LocalizedText;
  artworks: Artwork[];
};

const collectionNotice: LocalizedText = {
  ja: "全ての作品は、広島平和記念資料館所蔵です。",
  en: "All artworks are in the collection of the Hiroshima Peace Memorial Museum.",
};

const guestInstruction: LocalizedText = {
  ja: "絵画を一つ選んでください。",
  en: "Please select one artwork.",
};

const commentIntro: LocalizedText = {
  ja: `この作品を鑑賞してあなたが感じたことをコメント欄に入力してください。

思いやりと敬意をもってご感想をお寄せください。
この空間は共感と創造を大切にしています。誹謗中傷や他者を傷つける内容はお控えください。`,
  en: `Please share your thoughts and feelings about this artwork in the comment box below.

We kindly ask that you write with compassion and respect.
This space values empathy and creativity — please refrain from posting any hurtful or disrespectful comments.`,
};

const commentUi = {
  heading: {
    ja: "コメント一覧",
    en: "Comments",
  },
  noComment: {
    ja: "まだコメントがありません。",
    en: "No comments yet.",
  },
  save: {
    ja: "コメントを保存",
    en: "Save",
  },
  saving: {
    ja: "保存中...",
    en: "Saving...",
  },
  label: {
    ja: "コメント",
    en: "Comment",
  },
  placeholder: {
    ja: "あなたの想い",
    en: "Your thoughts and feelings",
  },
  hostButton: {
    ja: "想いが重ねられた作品をご覧になりたい方はこちらへ",
    en: "See works with shared comments here",
  },
  delete: {
    ja: "削除",
    en: "Delete",
  },
  deleting: {
    ja: "削除中...",
    en: "Deleting...",
  },
  confirmDelete: {
    ja: "このコメントを削除しますか？",
    en: "Do you want to delete this comment?",
  },
  passwordPrompt: {
    ja: "削除用パスワードを入力してください。",
    en: "Enter the password for deletion.",
  },
  passwordMismatch: {
    ja: "パスワードが一致しません。",
    en: "The password does not match.",
  },
  passwordNotConfigured: {
    ja: "削除用パスワードが設定されていません。",
    en: "The delete password is not configured.",
  },
  saveError: {
    ja: "コメントの保存中にエラーが発生しました。",
    en: "An error occurred while saving your comment.",
  },
  deleteError: {
    ja: "コメントの削除中にエラーが発生しました。",
    en: "An error occurred while deleting your comment.",
  },
} as const satisfies Record<string, LocalizedText>;

const hostUi = {
  gallery: {
    ja: "Gallery",
    en: "Gallery",
  },
  description: {
    ja: "鑑賞者の想いが重ねられた作品をご覧ください。（ご覧になりたい作品をクリックしてください。）",
    en: "View artworks layered with the thoughts of their viewers. (Click on a work to explore.)",
  },
} as const satisfies Record<string, LocalizedText>;

export const guestGalleries: GuestGallery[] = [
  {
    id: "a",
    guestListPath: "/guest/a",
    guestDetailPath: "/guest/a2",
    heading: {
      ja: "李鍾根さん",
      en: "Lee Jong-keun",
    },
    storyMapButton: {
      ja: "李鍾根さんストーリーマップ",
      en: "Story Map of Mr. Lee Jong-geun",
    },
    storyMapUrl: "https://arcg.is/Oy1D00",
    storyImageUrl: "/L.png",
    storyTitle: {
      ja: "在日韓国人被爆者 李鍾根 (ｲ・ｼﾞｮﾝｸﾞﾝ) 人生ストーリー",
      en: "A Life Story of Korean A-bomb Survivor Lee Jong-geun",
    },
    storyDescription: {
      ja: "83歳まで「江川政市」という日本名を名乗ってきた在日韓国人の李鍾根さん。なぜ、日本名を名乗り、日本で被爆しなければならなかったのでしょう。そして、どのような人生を送り、どのようなメッセージを後世に伝えたのでしょうか。",
      en: "Mr. Lee Jong-geun, a Korean A-bomb survivor who lived under the Japanese name 'Egawa Masaichi' until the age of 83. Why did he use a Japanese name and suffer the atomic bombing in Japan? What kind of life did he live, and what message does he leave for future generations?",
    },
    artworks: [
      {
        id: "l1",
        thumbUrl: "/L_1_L.png",
        imageUrl: "/L_1.jpg",
        title: {
          ja: "閃光",
          en: "A Flash of Light",
        },
        author: {
          ja: "曽根沙也佳",
          en: "Sayaka Sone",
        },
      },
      {
        id: "l2",
        thumbUrl: "/L_2_L.png",
        imageUrl: "/L_2.jpg",
        title: {
          ja: "閃光ののち伏せた場面",
          en: "Lying Face Down Immediately After a Flash of Light",
        },
        author: {
          ja: "倉重侑季",
          en: "Yuki Kurashige",
        },
      },
      {
        id: "l3",
        thumbUrl: "/L_3_L.png",
        imageUrl: "/L_3.jpg",
        title: {
          ja: "被爆後に立ち上がったところ（荒神橋から見た爆風によってなぎ倒された家々）",
          en: "When I Stood Up After the Bombing - A Scene Near the Kojin Bridge Where Buildings Were Devastated by the Blast",
        },
        author: {
          ja: "富田真衣",
          en: "Mai Tomita",
        },
      },
      {
        id: "l4",
        thumbUrl: "/L_4_L.png",
        imageUrl: "/L_4.jpg",
        title: {
          ja: "橋のたもとの被爆者が私を見つめている",
          en: "A-bomb Victims at the Foot of a Bridge Watching Me",
        },
        author: {
          ja: "倉重侑季",
          en: "Yuki Kurashige",
        },
      },
      {
        id: "l5",
        thumbUrl: "/L_5_L.png",
        imageUrl: "/L_5.jpg",
        title: {
          ja: "熱線で火傷し機関車のオイルを塗っている",
          en: "They Put Steam Locomotive Oil on My Burns Caused by Heat Rays",
        },
        author: {
          ja: "富田真衣",
          en: "Mai Tomita",
        },
      },
    ],
  },
  {
    id: "b",
    guestListPath: "/guest/b",
    guestDetailPath: "/guest/b2",
    heading: {
      ja: "兒玉光雄さん",
      en: "Kodama Mitsuo",
    },
    storyMapButton: {
      ja: "兒玉光雄さんストーリーマップ",
      en: "Story Map of Mr. Mitsuo Kodama",
    },
    storyMapUrl: "https://arcg.is/qLLLX2",
    storyImageUrl: "/K.png",
    storyTitle: {
      ja: "至近距離被爆者・兒玉光雄 ー「人間」として生き抜いた「光」の記憶ー",
      en: "A-Bomb Survivor at Close Range - The Memory of 'Light' as a Human Being",
    },
    storyDescription: {
      ja: "中学1年生（12歳）の時、爆心地から約870メートル地点で被爆し、還暦（60歳）を過ぎてから重複癌と闘ってきた兒玉光雄さん。そのライフストーリーから、私たちが学べることは何でしょうか？",
      en: "Mr. Mitsuo Kodama was a first-year middle school student (12 years old) when he was exposed to the atomic bomb about 870 meters from the hypocenter. After the age of 60, he battled multiple cancers. What can we learn from his life story?",
    },
    artworks: [
      {
        id: "k1",
        thumbUrl: "/K_1_L.png",
        imageUrl: "/K_1.jpg",
        title: {
          ja: "倒壊校舎からの脱出",
          en: "Escaping from the Debris of a Collapsed School Building",
        },
        author: {
          ja: "花岡美優",
          en: "Miyu Hanaoka",
        },
      },
      {
        id: "k2",
        thumbUrl: "/K_2_L.png",
        imageUrl: "/K_2.jpg",
        title: {
          ja: "プールサイドの惨劇",
          en: "Poolside Tragedy",
        },
        author: {
          ja: "室星理歩",
          en: "Riho Muroboshi",
        },
      },
      {
        id: "k3",
        thumbUrl: "/K_3_L.png",
        imageUrl: "/K_3.jpg",
        title: {
          ja: "『友達を助けてくれ！』『火が廻って来たぞ、逃げろ！』",
          en: "\"Give Your Hand to Rescue Him!\" \"Fire is Approaching!\"",
        },
        author: {
          ja: "宮本陽菜",
          en: "Hina Miyamoto",
        },
      },
      {
        id: "k4",
        thumbUrl: "/K_4_L.png",
        imageUrl: "/K_4.jpg",
        title: {
          ja: "人間襤褸（らんる）の群れの中に",
          en: "Amid a Throng of Wounded People Who Looked Like Rags",
        },
        author: {
          ja: "津村果奈",
          en: "Kana Tsumura",
        },
      },
      {
        id: "k5",
        thumbUrl: "/K_5_L.png",
        imageUrl: "/K_5.jpg",
        title: {
          ja: "忘れられない 〜あの眼",
          en: "Eyes That Cannot Be Forgotten",
        },
        author: {
          ja: "富田葵天",
          en: "Sora Tomita",
        },
      },
    ],
  },
];

export const guestGalleryById = Object.fromEntries(
  guestGalleries.map((gallery) => [gallery.id, gallery]),
) as Record<GuestGallery["id"], GuestGallery>;

export const artworkById = Object.fromEntries(
  guestGalleries.flatMap((gallery) => gallery.artworks.map((artwork) => [artwork.id, artwork])),
) as Record<string, Artwork>;

export function getArtwork(id: string) {
  return artworkById[id];
}

export function getArtworkOrFallback(id: string) {
  return getArtwork(id) ?? guestGalleryById.a.artworks[0];
}

export function formatArtworkDescription(artwork: Artwork, lang: AppLang) {
  if (lang === "ja") {
    return `作品名「${artwork.title.ja}」${artwork.author.ja}`;
  }

  return `${artwork.title.en} / ${artwork.author.en}`;
}

export const galleryCopy = {
  collectionNotice,
  guestInstruction,
  commentIntro,
  commentUi,
  hostUi,
};
