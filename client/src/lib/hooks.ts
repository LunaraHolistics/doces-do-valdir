import { useEffect, useState } from "react";
import { supabase, hasSupabase } from "./supabase";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_ORDERS } from "../data/mock";

export function useCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!hasSupabase) {
        setProducts(MOCK_PRODUCTS);
        setCategories(MOCK_CATEGORIES);
        setLoading(false);
        return;
      }
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from("products").select("*").eq("active", true).order("name"),
          supabase.from("categories").select("*").eq("active", true).order("sort")
        ]);
        if (prodRes.data && prodRes.data.length > 0) {
          setProducts(prodRes.data);
          setCategories(catRes.data || []);
        } else {
          setProducts(MOCK_PRODUCTS);
          setCategories(MOCK_CATEGORIES);
        }
      } catch (e) {
        console.error(e);
        setProducts(MOCK_PRODUCTS);
        setCategories(MOCK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { products, categories, loading };
}

export function useOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  const reload = async () => {
    if (!hasSupabase) { setOrders(MOCK_ORDERS); return; }
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
  };

  useEffect(() => { reload(); }, []);

  const patch = async (id: string, changes: any) => {
    if (hasSupabase) await supabase.from("orders").update(changes).eq("id", id);
    setOrders(os => os.map(o => (o.id === id ? { ...o, ...changes } : o)));
  };

  return { orders, patch, reload };
}

export function useProducts() {
  const [prods, setProds] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!hasSupabase) { setProds(MOCK_PRODUCTS); return; }
      const { data } = await supabase.from("products").select("*").order("name");
      setProds(data && data.length ? data : MOCK_PRODUCTS);
    };
    load();
  }, []);

  const patchProd = async (id: string, changes: any) => {
    if (hasSupabase) await supabase.from("products").update(changes).eq("id", id);
    setProds(ps => ps.map(p => (p.id === id ? { ...p, ...changes } : p)));
  };

  const insertProd = async (obj: any) => {
    if (hasSupabase) {
      const { data } = await supabase.from("products").insert(obj).select().single();
      if (data) setProds(ps => [data, ...ps]);
    } else {
      setProds(ps => [{ ...obj, id: "p" + Date.now() }, ...ps]);
    }
  };

  return { prods, patchProd, insertProd };
}

export function useSettings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (!hasSupabase) return;
    supabase.from("settings").select("*").eq("id", 1).maybeSingle()
      .then(({ data }) => setSettings(data || null));
  }, []);

  const saveSettings = async (form: any) => {
    if (hasSupabase) await supabase.from("settings").update(form).eq("id", 1);
    setSettings((s: any) => ({ ...s, ...form }));
  };

  return { settings, saveSettings };
}