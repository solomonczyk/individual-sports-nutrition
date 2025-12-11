# Настройка SSH ключей для доступа без пароля

## Шаг 1: Проверка SSH ключа (уже есть ✓)

Ваш публичный ключ находится в: `C:\Users\Andy\.ssh\id_ed25519.pub`

## Шаг 2: Копирование ключа на сервер

### Вариант A: Автоматический (если у вас установлен ssh-copy-id)

```bash
ssh-copy-id root@152.53.227.37
```

### Вариант B: Вручную (рекомендуется для Windows)

1. **Скопируйте содержимое вашего публичного ключа:**

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

2. **Подключитесь к серверу (один раз с паролем):**

```bash
ssh root@152.53.227.37
```

3. **На сервере выполните:**

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ_СЮДА" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### Вариант C: PowerShell команда (автоматически)

```powershell
# Скопируйте эту команду, заменив ПУБЛИЧНЫЙ_КЛЮЧ на содержимое id_ed25519.pub
$pubKey = Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
ssh root@152.53.227.37 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

## Шаг 3: Проверка подключения

После копирования ключа, попробуйте подключиться без пароля:

```bash
ssh root@152.53.227.37
```

Если всё настроено правильно, вы подключитесь без запроса пароля.

## Шаг 4: Настройка SSH config (опционально, для удобства)

Создайте файл `C:\Users\Andy\.ssh\config` (если его нет) и добавьте:

```
Host isn-server
    HostName 152.53.227.37
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Теперь вы можете подключаться просто:
```bash
ssh isn-server
```

## Устранение проблем

Если подключение не работает:

1. **Проверьте права доступа на сервере:**
   ```bash
   ssh root@152.53.227.37 "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
   ```

2. **Проверьте содержимое authorized_keys:**
   ```bash
   ssh root@152.53.227.37 "cat ~/.ssh/authorized_keys"
   ```

3. **Проверьте логи SSH на сервере:**
   ```bash
   ssh root@152.53.227.37 "tail -f /var/log/auth.log"
   ```

4. **Убедитесь, что SSH сервер разрешает ключи:**
   ```bash
   ssh root@152.53.227.37 "grep -i PubkeyAuthentication /etc/ssh/sshd_config"
   ```
   Должно быть: `PubkeyAuthentication yes`

