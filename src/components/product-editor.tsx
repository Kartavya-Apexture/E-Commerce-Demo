"use client";
import { useActionState, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct } from "@/app/actions";
import {
  categories,
  sizes,
  imageLibrary,
  type Product,
  type Result,
  type Size,
} from "@/lib/types";
type Group = {
  colour: string;
  images: string[];
  variants: { id: string; size: Size; stock: number }[];
};
const emptyGroup = (): Group => ({
  colour: "",
  images: [imageLibrary[0]],
  variants: sizes.map((size) => ({ id: "", size, stock: 5 })),
});
export function ProductEditor({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(
    saveProduct,
    null as Result<string> | null,
  );
  const [groups, setGroups] = useState<Group[]>(() =>
    product
      ? [
          ...new Set(
            product.variants
              .filter((v) => v.active !== false)
              .map((v) => v.colour),
          ),
        ].map((colour) => ({
          colour,
          images: product.galleries.find((g) => g.colour === colour)
            ?.images || [product.image],
          variants: sizes.map((size) => {
            const v = product.variants.find(
              (v) =>
                v.colour === colour && v.size === size && v.active !== false,
            );
            return { id: v?.id || "", size, stock: v?.stock || 0 };
          }),
        }))
      : [emptyGroup()],
  );
  function update(index: number, group: Group) {
    setGroups(groups.map((g, i) => (i === index ? group : g)));
  }
  return (
    <form action={action} className="product-edit">
      <section className="panel form-stack">
        <input type="hidden" name="id" value={product?.id || ""} />
        <input type="hidden" name="groups" value={JSON.stringify(groups)} />
        <h2>Product details</h2>
        <label>
          Product name
          <input
            name="name"
            required
            minLength={3}
            maxLength={120}
            defaultValue={product?.name}
          />
        </label>
        <div className="form-grid">
          <label>
            Category
            <select
              name="category"
              defaultValue={product?.category || "Dresses"}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Selling price (₹)
            <input
              name="price"
              type="number"
              min="0.01"
              max="100000"
              step="0.01"
              required
              defaultValue={product ? product.price / 100 : ""}
            />
          </label>
          <label>
            Original price (₹, 0 = no sale)
            <input
              name="originalPrice"
              type="number"
              min="0"
              max="100000"
              step="0.01"
              defaultValue={(product?.originalPrice || 0) / 100}
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured}
            />{" "}
            Featured in the K&G edit
          </label>
        </div>
        <label>
          Description
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            defaultValue={product?.description}
          />
        </label>
        <label>
          Fabric & care
          <input
            name="fabric"
            required
            minLength={3}
            maxLength={200}
            defaultValue={product?.fabric}
          />
        </label>
        <label>
          Fit details
          <input
            name="fit"
            required
            minLength={3}
            maxLength={300}
            defaultValue={
              product?.fit || "Regular fit. Choose your usual size."
            }
          />
        </label>
        <h2>Colours, images & inventory</h2>
        <p className="muted">
          Use images of the same garment and colour. Removing a colour
          deactivates its variants; existing order details are preserved.
        </p>
        {groups.map((g, index) => (
          <section className="variant-editor" key={index}>
            <div className="dialog-heading">
              <h3>Colour {index + 1}</h3>
              {groups.length > 1 && (
                <button
                  type="button"
                  className="text-link"
                  aria-label={`Remove colour ${index + 1}`}
                  onClick={() =>
                    setGroups(groups.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 size={15} /> Remove
                </button>
              )}
            </div>
            <label>
              Colour
              <input
                required
                minLength={2}
                maxLength={40}
                value={g.colour}
                onChange={(e) =>
                  update(index, { ...g, colour: e.target.value })
                }
              />
            </label>
            {g.images.map((src, j) => (
              <div className="gallery-editor" key={j}>
                <Image
                  src={src}
                  alt="Selected garment"
                  width={55}
                  height={70}
                />
                <label>
                  Image library {j + 1}
                  <select
                    value={src}
                    onChange={(e) =>
                      update(index, {
                        ...g,
                        images: g.images.map((s, i) =>
                          i === j ? e.target.value : s,
                        ),
                      })
                    }
                  >
                    {imageLibrary.map((path) => (
                      <option key={path} value={path}>
                        {path.replace("/images/", "")}
                      </option>
                    ))}
                  </select>
                </label>
                {j > 0 && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove image ${j + 1}`}
                    onClick={() =>
                      update(index, {
                        ...g,
                        images: g.images.filter((_, i) => i !== j),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            {g.images.length < 5 && (
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  update(index, { ...g, images: [...g.images, g.images[0]] })
                }
              >
                Add another view
              </button>
            )}
            <div className="stock-inputs">
              {g.variants.map((v, j) => (
                <label key={v.size}>
                  {v.size}
                  <input
                    type="number"
                    aria-label={index ? `${g.colour} ${v.size}` : v.size}
                    required
                    min={0}
                    max={10000}
                    value={v.stock}
                    onChange={(e) =>
                      update(index, {
                        ...g,
                        variants: g.variants.map((item, i) =>
                          i === j
                            ? { ...item, stock: Number(e.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
        {groups.length < 8 && (
          <button
            type="button"
            className="button outline"
            onClick={() => setGroups([...groups, emptyGroup()])}
          >
            <Plus size={17} /> Add colour
          </button>
        )}
        {state && !state.ok && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}
        <button className="button" disabled={pending}>
          {pending ? "Saving…" : "Save product"}
        </button>
      </section>
      <aside className="panel editor-preview">
        <h2>Primary image</h2>
        <div className="edit-image">
          <Image
            src={groups[0]?.images[0] || imageLibrary[0]}
            alt="Primary product preview"
            fill
            sizes="350px"
          />
        </div>
        <p className="muted">
          The first colour’s first photograph appears on product cards. Use the
          supplied image library; uploads are outside this demo.
        </p>
      </aside>
    </form>
  );
}
