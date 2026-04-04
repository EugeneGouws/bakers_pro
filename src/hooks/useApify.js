import { useState } from "react";
import { fetchApifyProducts, chooseBestCandidate } from "../lib/apify.js";
import { applySelectedProduct } from "../lib/productSelection.js";

// Manages the full Apify/Checkers price-update cycle:
//   1. runPriceUpdate(selectedNames, dbState, setDb) — fetches candidates for each selected ingredient
//   2. acceptProduct(product)  — applies the chosen candidate and advances the review queue
//   3. skipReview()            — skips current item and advances the review queue
//
// Returns:
//   { priceRunning, priceProgress, reviewItem, reviewQueue,
//     runPriceUpdate, acceptProduct, skipReview, error, clearError }
export default function useApify() {
  const [priceRunning, setPriceRunning]   = useState(false);
  const [priceProgress, setPriceProgress] = useState(null); // { done, total, current }
  const [reviewQueue, setReviewQueue]     = useState([]);
  const [reviewItem, setReviewItem]       = useState(null);
  const [error, setError]                 = useState(null);

  // selectedNames: Set<string> of ingredient names to update
  // dbState: current DB array
  // setDb: setter from useDb (persists automatically)
  async function runPriceUpdate(selectedNames, dbState) {
    if (priceRunning || selectedNames.size === 0) return;

    setPriceRunning(true);
    setError(null);

    const targets = dbState.filter(ing => selectedNames.has(ing.name));
    setPriceProgress({ done: 0, total: targets.length, current: targets[0]?.name ?? "" });

    setReviewItem(null);
    setReviewQueue([]);
    let firstSet = false;
    const errors = [];

    for (let i = 0; i < targets.length; i++) {
      const ing = targets[i];
      setPriceProgress({ done: i, total: targets.length, current: ing.name });
      try {
        const candidates = await fetchApifyProducts(ing);
        if (candidates.length === 0) continue;
        const { best, score, all } = chooseBestCandidate(ing, candidates);
        const result = { ingredient: ing, all, best, score };
        if (!firstSet) {
          setReviewItem(result);
          firstSet = true;
        } else {
          setReviewQueue(prev => [...prev, result]);
        }
      } catch (e) {
        errors.push(`"${ing.name}": ${e.message}`);
      }
    }

    setPriceProgress({ done: targets.length, total: targets.length, current: "" });
    if (errors.length > 0) setError(`Price update errors — ${errors.join("; ")}`);

    setPriceRunning(false);
  }

  function _advance(queue) {
    if (queue.length > 0) {
      setReviewItem(queue[0]);
      setReviewQueue(queue.slice(1));
    } else {
      setReviewItem(null);
      setReviewQueue([]);
    }
  }

  // product: the candidate the user selected; dbState + setDb to commit
  function acceptProduct(product, dbState, setDb) {
    if (!reviewItem) return;
    const updated = dbState.map(d => {
      if (d.name !== reviewItem.ingredient.name) return d;
      return applySelectedProduct(d, product);
    });
    setDb(updated);
    _advance(reviewQueue);
  }

  function skipReview() {
    _advance(reviewQueue);
  }

  return {
    priceRunning,
    priceProgress,
    reviewItem,
    reviewQueue,
    runPriceUpdate,
    acceptProduct,
    skipReview,
    error,
    clearError: () => setError(null),
  };
}
