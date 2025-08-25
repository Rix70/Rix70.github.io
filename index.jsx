import React, { useEffect, useMemo, useRef, useState } from "react";

// Страница учета проданных футболок
// Особенности:
// - Фото товара (загрузка файла или вставка URL)
// - Размеры S, M, L, кнопки + и - для изменения остатка
// - Возможность добавлять несколько товаров
// - Сохранение в localStorage
// - Экспорт в CSV, сброс остатков
// - Минималистичный UI на Tailwind

const LS_KEY = "tshirt_inventory_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

const defaultSizes = () => ({ S: 0, M: 0, L: 0 });

function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SizeControl({ label, value, onInc, onDec }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 p-3 border border-gray-200">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDec}
          className={classNames(
            "px-3 py-2 rounded-xl border text-sm",
            value === 0
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 hover:bg-gray-100"
          )}
          disabled={value === 0}
          aria-label={`Уменьшить ${label}`}
        >
          −
        </button>
        <div className="min-w-[3ch] text-center font-semibold" aria-live="polite">{value}</div>
        <button
          type="button"
          onClick={onInc}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-100"
          aria-label={`Увеличить ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product, onChange, onRemove }) {
  const fileInputRef = useRef(null);

  const total = product.sizes.S + product.sizes.M + product.sizes.L;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataURL(file);
    onChange({ ...product, image: url });
  }

  function updateSize(size, delta) {
    const next = Math.max(0, (product.sizes[size] ?? 0) + delta);
    onChange({ ...product, sizes: { ...product.sizes, [size]: next } });
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 shadow-sm bg-white">
      <div className="flex items-start gap-4">
        <div className="w-36 h-36 shrink-0 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
          {product.image ? (
            <img src={product.image} alt={product.name || "фото товара"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-400 px-2 text-center">Фото товара</span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={product.name}
            onChange={(e) => onChange({ ...product, name: e.target.value })}
            placeholder="Название товара (например, Футболка Classic)"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={product.image && product.image.startsWith("data:") ? "" : product.image || ""}
              onChange={(e) => onChange({ ...product, image: e.target.value })}
              placeholder="Вставьте URL изображения"
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
            >
              Загрузить
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SizeControl
              label="S"
              value={product.sizes.S}
              onInc={() => updateSize("S", +1)}
              onDec={() => updateSize("S", -1)}
            />
            <SizeControl
              label="M"
              value={product.sizes.M}
              onInc={() => updateSize("M", +1)}
              onDec={() => updateSize("M", -1)}
            />
            <SizeControl
              label="L"
              value={product.sizes.L}
              onInc={() => updateSize("L", +1)}
              onDec={() => updateSize("L", -1)}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-gray-600">Итого остаток: <span className="font-semibold text-gray-900">{total}</span></div>
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Удалить товар
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryTShirts() {
  const [products, setProducts] = useLocalStorageState(LS_KEY, [
    { id: uid(), name: "Футболка Classic", image: "", sizes: defaultSizes() },
  ]);

  const totals = useMemo(() => {
    const sum = { S: 0, M: 0, L: 0, all: 0 };
    for (const p of products) {
      sum.S += p.sizes.S;
      sum.M += p.sizes.M;
      sum.L += p.sizes.L;
    }
    sum.all = sum.S + sum.M + sum.L;
    return sum;
  }, [products]);

  function addProduct() {
    setProducts([
      { id: uid(), name: "Новый товар", image: "", sizes: defaultSizes() },
      ...products,
    ]);
  }

  function updateProduct(id, next) {
    setProducts(products.map((p) => (p.id === id ? next : p)));
  }

  function removeProduct(id) {
    setProducts(products.filter((p) => p.id !== id));
  }

  function resetAll() {
    if (!confirm("Сбросить остатки всех товаров?")) return;
    setProducts(products.map((p) => ({ ...p, sizes: defaultSizes() })));
  }

  function exportCSV() {
    const header = ["Название", "S", "M", "L", "Итого"].join(",");
    const rows = products.map((p) => [
      escapeCSV(p.name || "Без названия"),
      p.sizes.S,
      p.sizes.M,
      p.sizes.L,
      p.sizes.S + p.sizes.M + p.sizes.L,
    ].join(","));

    const footer = [
      "ИТОГО",
      totals.S,
      totals.M,
      totals.L,
      totals.all,
    ].join(",");

    const csv = [header, ...rows, footer].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeCSV(value) {
    const v = String(value ?? "");
    if (v.includes(",") || v.includes("\n") || v.includes('"')) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Учет проданных футболок</h1>
            <p className="text-sm text-gray-600">Фото товара, размеры S/M/L и быстрые кнопки изменения остатков.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addProduct}
              className="rounded-2xl px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
            >
              Добавить товар
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-2xl px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
            >
              Сбросить остатки
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="rounded-2xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              Экспорт CSV
            </button>
          </div>
        </header>

        <section className="grid gap-4 mb-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onChange={(next) => updateProduct(p.id, next)}
              onRemove={() => removeProduct(p.id)}
            />
          ))}
        </section>

        <footer className="sticky bottom-0 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              Итого по размерам: <span className="font-semibold">S</span> {totals.S}, <span className="font-semibold">M</span> {totals.M}, <span className="font-semibold">L</span> {totals.L}
            </div>
            <div className="text-sm">
              Общий остаток: <span className="font-semibold">{totals.all}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
