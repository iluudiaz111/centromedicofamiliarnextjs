-- Este SQL no se ejecuta directamente en Supabase
-- Es solo para referencia de los pasos necesarios

-- 1. Crear un bucket en Supabase Storage
-- Esto se hace desde la interfaz de Supabase:
-- 1. Ve a Storage en el panel lateral
-- 2. Haz clic en "Create a new bucket"
-- 3. Nombre: centro-medico
-- 4. Tipo: Public (para que las imágenes sean accesibles públicamente)
-- 5. Haz clic en "Create bucket"

-- 2. Configurar políticas de acceso (RLS)
-- Esto también se hace desde la interfaz de Supabase:
-- 1. Ve al bucket recién creado
-- 2. Haz clic en "Policies"
-- 3. Configura las políticas según tus necesidades:
--    - Para lectura pública: SELECT para anon
--    - Para escritura autenticada: INSERT para authenticated
