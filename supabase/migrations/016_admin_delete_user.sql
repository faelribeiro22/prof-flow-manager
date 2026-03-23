-- Migration: Admin delete user with cascading data

CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  admin_count INT;
  target_role public.user_role;
BEGIN
  -- Verifica se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar usuarios';
  END IF;

  -- Impede auto-deleção
  IF auth.uid() = user_id_to_delete THEN
    RAISE EXCEPTION 'Nao e permitido deletar sua propria conta';
  END IF;

  -- Obtém o role do usuário a ser deletado
  SELECT role INTO target_role FROM public.profiles WHERE user_id = user_id_to_delete;
  
  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Usuario nao encontrado';
  END IF;

  -- Se é admin, verifica se há outros admins
  IF target_role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin' AND user_id != user_id_to_delete;
    
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Nao e permitido deletar o ultimo administrador do sistema';
    END IF;
  END IF;

  -- Deleta em cascata
  DELETE FROM public.schedules
  WHERE teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = user_id_to_delete
  );

  DELETE FROM public.special_lists
  WHERE teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = user_id_to_delete
  );

  DELETE FROM public.teachers WHERE user_id = user_id_to_delete;
  DELETE FROM public.profiles WHERE user_id = user_id_to_delete;
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

COMMENT ON FUNCTION public.admin_delete_user(UUID) IS
  'Deleta um usuario (admin ou professor) com validacoes de seguranca e cascata de dados relacionados.';
