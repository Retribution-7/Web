import { IProduct } from "./types/product.interface";

const catalogData: IProduct[] = [
  {
    id: 1,
    title: "Дизайн гостиной",
    description: "Современный минимализм с элементами лофта",
    category: "interior",
    price: 1200,
    rating: 4.9,
    imageUrl: "/images/blog/blog-1.svg",
  },
  {
    id: 2,
    title: "Укладка паркета",
    description: "Натуральный дуб, идеальная стыковка",
    category: "interior",
    price: 450,
    rating: 4.7,
    imageUrl: "/images/blog/blog-2.svg",
  },
  {
    id: 3,
    title: "Отделка фасада",
    description: "Долговечные материалы, защита от влаги",
    category: "exterior",
    price: 2800,
    rating: 4.8,
    imageUrl: "/images/blog/blog-3.svg",
  },
  {
    id: 4,
    title: "Облицовочный камень",
    description: "Искусственный камень высшего качества",
    category: "materials",
    price: 85,
    rating: 4.5,
    imageUrl: "/images/blog/blog-4.svg",
  },
  {
    id: 5,
    title: "Проект коттеджа",
    description: "Индивидуальная планировка и чертежи",
    category: "exterior",
    price: 5000,
    rating: 5.0,
    imageUrl: "/images/blog/blog-1.svg",
  },
  {
    id: 6,
    title: "Малярные работы",
    description: "Покраска без разводов и пятен",
    category: "interior",
    price: 150,
    rating: 4.3,
    imageUrl: "/images/blog/blog-2.svg",
  },
  {
    id: 7,
    title: "Бетонная смесь",
    description: "Марка М400, высокая прочность",
    category: "materials",
    price: 12,
    rating: 4.6,
    imageUrl: "/images/blog/blog-3.svg",
  },
  {
    id: 8,
    title: "Строительство бани",
    description: "Сруб из кедра под ключ",
    category: "exterior",
    price: 8500,
    rating: 4.9,
    imageUrl: "/images/blog/blog-4.svg",
  },
  {
    id: 9,
    title: "Панорамные окна",
    description: "Энергосберегающие стеклопакеты",
    category: "interior",
    price: 1100,
    rating: 4.7,
    imageUrl: "/images/blog/blog-1.svg",
  },
  {
    id: 10,
    title: "Брус профилированный",
    description: "Зимний лес, сушка в камере",
    category: "materials",
    price: 320,
    rating: 4.4,
    imageUrl: "/images/blog/blog-2.svg",
  },
  {
    id: 11,
    title: "Кованый забор",
    description: "Ручная ковка, антикоррозийное покрытие",
    category: "exterior",
    price: 1500,
    rating: 4.8,
    imageUrl: "/images/blog/blog-3.svg",
  },
  {
    id: 12,
    title: "Керамогранит",
    description: "Итальянская коллекция, 60x60",
    category: "materials",
    price: 45,
    rating: 4.9,
    imageUrl: "/images/blog/blog-4.svg",
  },
  {
    id: 13,
    title: "Ремонт кухни",
    description: "Обновление коммуникаций и мебели",
    category: "interior",
    price: 2100,
    rating: 4.6,
    imageUrl: "/images/blog/blog-1.svg",
  },
  {
    id: 14,
    title: "Бассейн на участке",
    description: "Чаша из композита с фильтрацией",
    category: "exterior",
    price: 12000,
    rating: 5.0,
    imageUrl: "/images/blog/blog-2.svg",
  },
  {
    id: 15,
    title: "Штукатурка гипсовая",
    description: "Для внутренних работ, 30кг",
    category: "materials",
    price: 18,
    rating: 4.2,
    imageUrl: "/images/blog/blog-3.svg",
  },
];

let currentData = [...catalogData];

const container = document.getElementById("catalog-container") as HTMLElement;
const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const categorySelect = document.getElementById(
  "categorySelect",
) as HTMLSelectElement;
const sortSelect = document.getElementById("sortSelect") as HTMLSelectElement;

const renderCards = (data: IProduct[]) => {
  if (data.length === 0) {
    container.innerHTML = `<div class="empty-state">...</div>`;
    return;
  }

  container.innerHTML = data
    .map((item) => {
      // Вычисляем процент скидки, если есть старая цена
      const discountBadge = item.oldPrice
        ? `<span class="badge-discount">-${Math.round((1 - item.price / item.oldPrice) * 100)}%</span>`
        : "";

      const priceHTML = item.oldPrice
        ? `<div class="flex flex-col">
                 <span class="text-xs text-gray-400 line-through">$${item.oldPrice}</span>
                 <span class="product-card__price text-[#FF4D01]">$${item.price}</span>
               </div>`
        : `<span class="product-card__price">$${item.price}</span>`;

      return `
        <article class="product-card">
            <div class="relative overflow-hidden">
                <img src="${item.imageUrl}" alt="${item.title}" class="product-card__image">
                ${discountBadge} 
            </div>
            <div class="product-card__content">
                <div class="flex justify-between items-start mb-2 gap-2">
                    <h3 class="product-card__title">${item.title}</h3>
                    <span class="badge-rating">★ ${item.rating}</span>
                </div>
                <p class="product-card__desc">${item.description}</p>
                <div class="product-card__footer">
                    <span class="text-[10px] font-black uppercase text-gray-300 tracking-widest">${item.category}</span>
                    ${priceHTML}
                </div>
            </div>
        </article>
    `;
    })
    .join("");
};

const applyFiltersAndSort = () => {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  const sortBy = sortSelect.value;

  let filtered = catalogData.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm),
  );

  if (category !== "all") {
    filtered = filtered.filter((item) => item.category === category);
  }

  filtered.sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating-desc") return b.rating - a.rating;
    if (sortBy === "name-asc") return a.title.localeCompare(b.title);
    return a.id - b.id;
  });

  renderCards(filtered);
};

// Listeners
searchInput?.addEventListener("input", applyFiltersAndSort);
categorySelect?.addEventListener("change", applyFiltersAndSort);
sortSelect?.addEventListener("change", applyFiltersAndSort);

document.getElementById("btn-map")?.addEventListener("click", () => {
  const withDiscount = catalogData.map((item) => ({
    ...item,
    oldPrice: item.price, // Сохраняем текущую цену как старую
    price: Math.floor(item.price * 0.8), // Скидка 20%
    title: "Акция: " + item.title,
  }));
  renderCards(withDiscount);
});

// 2. .filter() — Фильтруем только дорогие услуги
document.getElementById("btn-filter")?.addEventListener("click", () => {
  renderCards(catalogData.filter((item) => item.price > 1000));
});

// 3. .sort() — Сортируем по рейтингу (от большего к меньшему)
document.getElementById("btn-sort")?.addEventListener("click", () => {
  const sorted = [...catalogData].sort((a, b) => b.rating - a.rating);
  renderCards(sorted);
});

// 4. .reduce() — Вычисляем общую стоимость всех услуг
document.getElementById("btn-reduce")?.addEventListener("click", () => {
  const total = catalogData.reduce((sum, item) => sum + item.price, 0);
  alert(`Общая стоимость всех услуг в каталоге: $${total}`);
});

// 5. .slice() — Выбираем только первые 3 "премиальные" услуги
document.getElementById("btn-slice")?.addEventListener("click", () => {
  renderCards(catalogData.slice(0, 3));
});

// 6. .find() — Находим конкретную услугу по ID (например, самую дорогую)
document.getElementById("btn-find")?.addEventListener("click", () => {
  const vip = catalogData.find((item) => item.price === 12000);
  renderCards(vip ? [vip] : []);
});

// 7. .every() — Проверяем, все ли услуги стоят больше 10$
document.getElementById("btn-every")?.addEventListener("click", () => {
  const allExpensive = catalogData.every((item) => item.price > 10);
  alert(allExpensive ? "Да, все услуги дороже $10" : "Нет, есть дешевле");
});

// 8. .some() — Проверяем, есть ли хоть одна услуга дешевле 50$
document.getElementById("btn-some")?.addEventListener("click", () => {
  const hasCheap = catalogData.some((item) => item.price < 50);
  alert(
    hasCheap
      ? "В каталоге есть бюджетные товары до $50"
      : "Дешевых товаров нет",
  );
});

// 9. .reverse() — Инвертируем порядок карточек
document.getElementById("btn-reverse")?.addEventListener("click", () => {
  const reversed = [...catalogData].reverse();
  renderCards(reversed);
});

// 10. .findIndex() — Ищем индекс товара "Бетонная смесь"
document.getElementById("btn-findindex")?.addEventListener("click", () => {
  const index = catalogData.findIndex(
    (item) => item.title === "Бетонная смесь",
  );
  alert(`Товар "Бетонная смесь" находится на ${index} позиции в массиве`);
});

// Инициализация
renderCards(currentData);
