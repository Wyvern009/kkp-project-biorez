const STORAGE_KEY = 'BIOREZ-LocalStorage';

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Gagal menyimpan data ke localStorage:', error);
  }
}

export function loadData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return [];
  } catch (error) {
    console.error('Gagal memuat data dari localStorage:', error);
    return [];
  }
}

export function clearData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Gagal menghapus data dari localStorage:', error);
  }
}
