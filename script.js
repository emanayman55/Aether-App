// تأكدي أن أول حرف صغير const
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const loadingBox = document.getElementById("loading");
const errorBox = document.getElementById("error-box");
const errorMsg = document.getElementById("error-msg");
const weatherCard = document.getElementById("weather-card");
const promptHint = document.getElementById("prompt-hint");
const cityName = document.getElementById("city-name");
const countryName = document.getElementById("country");
const dateTime = document.getElementById("date-time");
const weatherIcon = document.getElementById("weather-icon");
const temperatureEl = document.getElementById("temperature");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const visibilityEl = document.getElementById("visibility");
const descriptionEl = document.getElementById("description");
const unitButtons = Array.from(document.querySelectorAll(".unit-btn"));

const weatherCodeMap = {
  0: ["Clear skies", "☀"], 1: ["Mainly clear", "🌤"], 2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁"], 45: ["Fog", "🌫"], 48: ["Fog", "🌫"],
  51: ["Light drizzle", "🌦"], 53: ["Moderate drizzle", "🌦"], 55: ["Heavy drizzle", "🌧"],
  61: ["Light rain", "🌧"], 63: ["Moderate rain", "🌧"], 65: ["Heavy rain", "⛈"],
  95: ["Thunderstorm", "⛈"], 99: ["Severe thunderstorm", "⛈"]
  // ... بقية الخريطة تبعتك تمام
};

let currentWeather = null;
let currentUnits = "C";

searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleSearch();
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextUnit = button.dataset.unit;
    if (nextUnit === currentUnits) return;
    currentUnits = nextUnit;
    unitButtons.forEach((btn) => btn.classList.toggle("unit-btn--active", btn.dataset.unit === currentUnits));
    if (currentWeather) renderWeather(currentWeather);
  });
});

// الحالة الابتدائية عند تحميل الصفحة
window.addEventListener("load", () => {
  cityInput.focus();
  loadingBox.style.display = "none";
  errorBox.style.display = "none";
  weatherCard.style.display = "none";
  promptHint.style.display = "flex";
});

function handleSearch() {
  const query = cityInput.value.trim();
  if (!query) {
    showError("Please enter a city name.");
    return;
  }
  searchWeather(query);
}

async function searchWeather(query) {
  setLoading(true); // هون رح يختفي كل شي ويظهر التحميل
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please try another name.");
    }

    const place = geoData.results[0];
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true&hourly=apparent_temperature,relativehumidity_2m,visibility&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`);
    const weatherData = await weatherResponse.json();

    currentWeather = { location: place, weather: weatherData.current_weather, hourly: weatherData.hourly, timezone: weatherData.timezone };
    renderWeather(currentWeather);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false); // منوقف التحميل سواء نجح أو فشل
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    loadingBox.style.display = "flex";
    weatherCard.style.display = "none";
    errorBox.style.display = "none";
    promptHint.style.display = "none";
    searchBtn.disabled = true;
  } else {
    loadingBox.style.display = "none";
    searchBtn.disabled = false;
  }
}

function showError(message) {
  errorMsg.textContent = message;
  errorBox.style.display = "flex";
  weatherCard.style.display = "none";
  loadingBox.style.display = "none";
  promptHint.style.display = "none";
}

function renderWeather(data) {
  // 1. إخفاء كل الحالات الجانبية وإظهار الكرت
  setLoading(false);
  errorBox.style.display = "none";
  promptHint.style.display = "none";
  weatherCard.style.display = "grid"; 

  // 2. استخراج البيانات الأساسية
  const code = Number(data.weather.weathercode);
  const [description, symbol] = weatherCodeMap[code] || ["Unknown", "☁"];
  
  // جلب القيم من بيانات Hourly (الساعات) باستخدام الدالة المساعدة
  const feelsC = getHourlyValue("apparent_temperature", data.weather.time, data.hourly);
  const humidity = getHourlyValue("relativehumidity_2m", data.weather.time, data.hourly);
  const visibility = getHourlyValue("visibility", data.weather.time, data.hourly);

  // تحويل درجات الحرارة حسب الوحدة المختارة (C أو F)
  const tempC = Number(data.weather.temperature);
  const temperature = currentUnits === "C" ? tempC : (tempC * 9/5 + 32);
  const feelsLike = currentUnits === "C" ? feelsC : (feelsC * 9/5 + 32);

  // 3. تعبئة النصوص في العناصر (الربط مع الـ IDs الموجودة في HTML)
  cityName.textContent = data.location.name;
  countryName.textContent = data.location.country || "";
  descriptionEl.textContent = description;
  temperatureEl.textContent = `${Math.round(temperature)}°${currentUnits}`;
  
  // تحديث البيانات الأربعة اللي تحت (تأكدي أن الـ IDs صحيحة في الـ HTML)
  feelsLikeEl.textContent = feelsC !== null ? `${Math.round(feelsLike)}°${currentUnits}` : "—";
  humidityEl.textContent = humidity !== null ? `${Math.round(humidity)}%` : "—";
  windSpeedEl.textContent = `${Math.round(data.weather.windspeed)} km/h`;
  visibilityEl.textContent = visibility !== null ? `${Math.round(visibility / 1000)} km` : "—";

  // 4. تحديث الأيقونة والتاريخ
  weatherIcon.src = createIconSvg(symbol);
  dateTime.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long", hour: "numeric", minute: "2-digit", timeZone: data.timezone,
  }).format(new Date(data.weather.time));
}

// دالة إنشاء الأيقونات (لحل مشكلة createIconSvg is not defined)
function createIconSvg(symbol) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="32" fill="rgba(255,255,255,0.06)"/><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-size="64" font-family="Segoe UI Emoji, Arial, sans-serif">${symbol}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// دالة جلب القيم (للتأكد من أن بيانات الرطوبة والرياح تظهر)
function getHourlyValue(name, timestamp, hourly) {
  if (!hourly || !hourly.time) return null;
  const targetTime = new Date(timestamp).getTime();
  let closestIndex = -1;
  let minDiff = Infinity;

  hourly.time.forEach((timeStr, index) => {
    const diff = Math.abs(new Date(timeStr).getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  if (closestIndex === -1) return null;
  const values = hourly[name];
  if (!values || typeof values[closestIndex] === "undefined") return null;
  return Number(values[closestIndex]);
}