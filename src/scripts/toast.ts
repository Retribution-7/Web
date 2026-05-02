export type ToastType = "success" | "error";

function getStack(): HTMLElement {
  let stack = document.getElementById("__toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "__toast-stack";
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

export function showToast(message: string, type: ToastType = "success"): void {
  const stack = getStack();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  stack.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("toast--visible"));
  });

  setTimeout(() => {
    toast.classList.remove("toast--visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}
