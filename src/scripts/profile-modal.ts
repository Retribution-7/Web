import { getUser, setUser } from "../auth";
import { getTranslate, currentLang } from "./translate";
import { resetSettings } from "./settings";
import { showToast } from "./toast";

const PROFILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

function createModal(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "profile-modal";
  overlay.setAttribute("aria-hidden", "true");

  overlay.innerHTML = `
    <div class="modal-box max-w-lg" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h2 class="modal__title" data-i18n="profile-title">Personal Data</h2>
        <button class="modal__close" id="profile-modal-close" aria-label="Close">✕</button>
      </div>
      <form id="profile-form" class="flex flex-col gap-4 p-6">
        <div class="field-group">
          <label class="field-label" data-i18n="profile-firstname">First Name</label>
          <input class="field-input" id="pf-firstName" type="text" maxlength="50" />
        </div>
        <div class="field-group">
          <label class="field-label" data-i18n="profile-lastname">Last Name</label>
          <input class="field-input" id="pf-lastName" type="text" maxlength="50" />
        </div>
        <div class="field-group">
          <label class="field-label" data-i18n="profile-middlename">Middle Name</label>
          <input class="field-input" id="pf-middleName" type="text" maxlength="50" />
        </div>
        <div class="field-group">
          <label class="field-label" data-i18n="profile-nickname">Nickname</label>
          <input class="field-input input--readonly" id="pf-nickname" type="text" readonly />
        </div>
        <div class="field-group">
          <label class="field-label" data-i18n="profile-email">Email</label>
          <input class="field-input" id="pf-email" type="email" maxlength="100" />
        </div>
        <div class="field-group">
          <label class="field-label" data-i18n="profile-phone">Phone</label>
          <input class="field-input" id="pf-phone" type="tel" maxlength="20" />
        </div>
        <div class="field-group">
          <label class="field-label" data-i18n="profile-birthdate">Date of Birth</label>
          <input class="field-input" id="pf-birthDate" type="date" />
        </div>
        <div class="flex gap-3 mt-2">
          <button type="submit" class="btn-submit flex-1" data-i18n="profile-save">Save</button>
          <button type="button" id="profile-close-btn" class="btn-submit flex-1 bg-gray-500 hover:bg-gray-600" data-i18n="profile-close">Close</button>
        </div>
        <button type="button" id="profile-reset-btn" class="w-full py-2.5 rounded-xl border-2 border-red-300 text-red-500 font-inter font-semibold text-p4 hover:bg-red-50 transition-colors mt-1" data-i18n="profile-reset">Reset Settings</button>
      </form>
    </div>
  `;

  return overlay;
}

function fillForm(user: ReturnType<typeof getUser>): void {
  if (!user) return;
  const set = (id: string, val: string | undefined) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = val || "";
  };
  set("pf-firstName", user.firstName);
  set("pf-lastName", user.lastName);
  set("pf-middleName", user.middleName);
  set("pf-nickname", user.nickname);
  set("pf-email", user.email);
  set("pf-phone", user.phone);
  set("pf-birthDate", user.birthDate);
}

export function initProfileModal(): void {
  const iconBtn = document.getElementById("nav-user-icon");
  const mobileIcon = document.getElementById("mob-nav-user-icon");
  if (!iconBtn) return;

  const modal = createModal();
  document.body.appendChild(modal);

  function openModal(): void {
    const user = getUser();
    if (!user) return;
    fillForm(user);
    getTranslate(currentLang);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(): void {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  iconBtn.addEventListener("click", openModal);
  mobileIcon?.addEventListener("click", () => {
    openModal();
  });

  modal.querySelector("#profile-modal-close")?.addEventListener("click", closeModal);
  modal.querySelector("#profile-close-btn")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector("#profile-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user) return;
    user.firstName = (document.getElementById("pf-firstName") as HTMLInputElement).value;
    user.lastName = (document.getElementById("pf-lastName") as HTMLInputElement).value;
    user.middleName = (document.getElementById("pf-middleName") as HTMLInputElement).value;
    user.email = (document.getElementById("pf-email") as HTMLInputElement).value;
    user.phone = (document.getElementById("pf-phone") as HTMLInputElement).value;
    user.birthDate = (document.getElementById("pf-birthDate") as HTMLInputElement).value;
    setUser(user);
    showToast(currentLang === "ru" ? "Данные сохранены" : "Data saved", "success");
    closeModal();
  });

  modal.querySelector("#profile-reset-btn")?.addEventListener("click", () => {
    resetSettings();
    showToast(currentLang === "ru" ? "Настройки сброшены" : "Settings reset", "success");
    closeModal();
  });
}
