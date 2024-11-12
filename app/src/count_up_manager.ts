import { CountUp } from "countup.js";

export const countUpManager = new class {
  #countUps = new Map<HTMLElement, CountUp>();

  getCountUp(id: string) {
    const element = document.querySelector(`span[data-count-up="${id}"]`) as
      | HTMLElement
      | null;
    if (!element) {
      alert("null");
      return null;
    }
    const maybeCountUp = this.#countUps.get(element);
    if (maybeCountUp) {
      return maybeCountUp;
    }
    const countUp = new CountUp(element, 0);
    this.#countUps.set(element, countUp);
    console.log({ countUp });
    return countUp;
  }
}();
