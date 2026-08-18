// ── SMS-отправка OTP-кодов ───────────────────────────────────────────────
// Сейчас реального SMS-шлюза НЕТ — sendOtpSms() ничего не отправляет,
// а send-otp в routes/auth.ts вместо этого возвращает код прямо в ответе
// API (dev_otp), фронт показывает его жёлтой плашкой "dev". Это осознанное
// временное решение (подтверждено с заказчиком) — НЕ подключать банк
// живым клиентам, пока сюда не встроен реальный провайдер.
//
// Когда будет готов аккаунт в SMS-шлюзе (рекомендация — Eskiz.uz для
// узбекских номеров, https://eskiz.uz/), подключение — это:
//   1. Положить учётные данные в apps/api/.env (никогда не в код и не в git):
//        SMS_PROVIDER=eskiz
//        ESKIZ_EMAIL=...
//        ESKIZ_PASSWORD=...
//   2. Реализовать реальный вызов API внутри sendOtpSms() ниже
//      (Eskiz: POST /api/auth/login → token, затем POST /api/message/sms/send).
//   3. Убрать `dev_otp` из ответа /send-otp в routes/auth.ts.
//
// До тех пор isSmsConfigured() возвращает false, и main.ts печатает
// предупреждение при каждом старте сервера, чтобы это не потерялось.

export function isSmsConfigured(): boolean {
  return process.env.SMS_PROVIDER === 'eskiz' && !!process.env.ESKIZ_EMAIL && !!process.env.ESKIZ_PASSWORD;
}

export async function sendOtpSms(phone: string, code: string): Promise<{ sent: boolean }> {
  if (!isSmsConfigured()) {
    // Заглушка: SMS не уходит, код виден только через dev_otp в ответе API.
    return { sent: false };
  }

  // TODO: реальная интеграция с Eskiz.uz (или другим провайдером), когда
  // ESKIZ_EMAIL / ESKIZ_PASSWORD будут заданы в apps/api/.env.
  // Пример вызова (раскомментировать и адаптировать после получения аккаунта):
  //
  // const token = await getEskizToken();
  // await fetch('https://notify.eskiz.uz/api/message/sms/send', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ mobile_phone: phone.replace(/\D/g, ''), message: `Код для входа в CRM: ${code}`, from: '4546' }),
  // });

  return { sent: false };
}
