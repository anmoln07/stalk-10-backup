/*
 * Friends who reply under posts, and the accounts that memes/news are reposted from.
 * All invented. Avatars are in public/pfp (st-* ones come from SOCIALTRACE).
 */
export type Account = { name: string; avatar: string; verified?: "blue" | "gold" };

export const friends: Record<string, Account> = {
  arjun_m: { name: "Arjun Mehta", avatar: "st-g-pug.webp" },
  kavya_r: { name: "Kavya Reddy", avatar: "st-g-flowers.webp" },
  neel_k: { name: "Neel Kapoor", avatar: "st-g-guitar.webp" },
  sana_q: { name: "Sana Qureshi", avatar: "st-coffee.webp" },
  vikram_s: { name: "Vikram Shah", avatar: "st-g-mountains.webp" },
  riya_d: { name: "Riya Das", avatar: "st-g-iced-coffee.webp" },
  om_p: { name: "Om Patil", avatar: "st-g-sneakers.webp" },
  farah_a: { name: "Farah Ali", avatar: "st-g-parrot.webp" },
  jay_t: { name: "Jay Thakur", avatar: "st-g-city-night.webp" },
  mehak_g: { name: "Mehak Gill", avatar: "st-g-hamster.webp" },
  tanvi_s: { name: "Tanvi Sen", avatar: "st-g-cat.webp" },
  kunal_b: { name: "Kunal Bajaj", avatar: "st-g-ramen.webp" },
  ayesha_m: { name: "Ayesha Mir", avatar: "st-g-dusk-beach.webp" },
  rahul_v: { name: "Rahul Varma", avatar: "st-g-vinyl.webp" },
  nandini_k: { name: "Nandini Kulkarni", avatar: "st-chai.webp" },
  dhruv_j: { name: "Dhruv Jain", avatar: "st-city.webp" },
  pooja_m: { name: "Pooja Menon", avatar: "st-beach.webp" },
  ishita_g: { name: "Ishita Ghosh", avatar: "st-cliffs.webp" },
  zara_h: { name: "Zara Hussain", avatar: "st-rooftops.webp" },
  manav_r: { name: "Manav Rawat", avatar: "st-gumtree.webp" },
};

/** Meme pages. Each meme image is reposted from one of these (picked from the image name). */
export const memeAccounts: Record<string, Account> = {
  dailyscroll: { name: "Daily Scroll", avatar: "st-g-dusk-sky.webp", verified: "blue" },
  chai_and_memes: { name: "Chai & Memes", avatar: "st-g-pizza.webp" },
  snackbreak: { name: "Snack Break", avatar: "st-pav.webp" },
  sleepy_pages: { name: "Sleepy Pages", avatar: "st-rain.webp" },
};

/** Outlet avatars for news reposts; the outlet name comes from the card's `source`. */
export const outletAvatars = ["st-g-carpark.webp", "st-paddock.webp", "st-packing.webp", "st-g-dusk-sky.webp"];
