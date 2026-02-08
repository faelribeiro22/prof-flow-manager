-- Migration: Add end time columns to schedules
-- Permite definir horário de início e fim da aula (ex: 07:00-07:30)

-- Adiciona coluna de hora final (0-23)
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_hour INTEGER;

-- Adiciona coluna de minuto final (0-59)
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_minute INTEGER DEFAULT 0;

-- Constraint para validar valores de hora final (0-23)
ALTER TABLE schedules ADD CONSTRAINT valid_end_hour 
  CHECK (end_hour IS NULL OR (end_hour >= 0 AND end_hour <= 23));

-- Constraint para validar valores de minuto final (0-59)
ALTER TABLE schedules ADD CONSTRAINT valid_end_minute 
  CHECK (end_minute IS NULL OR (end_minute >= 0 AND end_minute <= 59));

-- Atualiza registros existentes para ter end_hour = hour + 1 (assumindo 1h de duração)
UPDATE schedules 
SET end_hour = CASE 
    WHEN hour = 23 THEN 0  -- Meia-noite se hora for 23
    ELSE hour + 1 
  END,
  end_minute = minute
WHERE end_hour IS NULL;

-- Após atualização, torna end_hour obrigatório
ALTER TABLE schedules ALTER COLUMN end_hour SET NOT NULL;

-- Índice para buscas por horário (início e fim)
CREATE INDEX IF NOT EXISTS idx_schedules_time_range ON schedules(hour, minute, end_hour, end_minute);

-- Constraint para garantir que o horário de fim é depois do início
-- (considera que aulas podem cruzar meia-noite)
ALTER TABLE schedules ADD CONSTRAINT valid_time_range
  CHECK (
    -- Caso normal: fim depois do início no mesmo dia
    (end_hour > hour OR (end_hour = hour AND end_minute > minute))
    -- Ou caso especial: aula que cruza meia-noite (ex: 23:00-00:30)
    OR (hour >= 22 AND end_hour <= 2)
  );

-- Comentário explicativo
COMMENT ON COLUMN schedules.end_hour IS 'Hora de término da aula (0-23)';
COMMENT ON COLUMN schedules.end_minute IS 'Minuto de término da aula (0-59)';
