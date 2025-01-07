USE BienStar;

CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasenia VARCHAR(60) NOT NULL,
    edad INT NOT NULL,
    genero VARCHAR(50),
    estatura INT,
    peso INT,
    avatar VARCHAR(255), -- Aumenté el tamaño por si tienes rutas largas
    avatar_updated_at DATETIME DEFAULT NULL
);


CREATE TABLE meta (
    id_meta INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE objetivo (
    id_objetivo INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE meta_objetivo (
    id_meta_objetivo INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT,
    id_meta INT,
    id_objetivo INT,
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
    FOREIGN KEY (id_meta) REFERENCES meta(id_meta),
    FOREIGN KEY (id_objetivo) REFERENCES objetivo(id_objetivo)
); 

CREATE TABLE semana (
    id_semana INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(20) NOT NULL
);

CREATE TABLE actividad (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    id_meta_objetivo INT,
    id_usuario INT,
    fecha_creacion DATE NOT NULL,
    fecha_terminado DATE NOT NULL,
    FOREIGN KEY (id_meta_objetivo) REFERENCES meta_objetivo(id_meta_objetivo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE actividad_semana (
    id_actividad INT,
    id_semana INT,
    PRIMARY KEY (id_actividad, id_semana),
    FOREIGN KEY (id_actividad) REFERENCES actividad(id_actividad) ON DELETE CASCADE,
    FOREIGN KEY (id_semana) REFERENCES semana(id_semana) ON DELETE CASCADE
);

CREATE TABLE horario (
    id_horario INT AUTO_INCREMENT PRIMARY KEY,
    id_actividad INT,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (id_actividad) REFERENCES actividad(id_actividad) ON DELETE CASCADE
);


CREATE TABLE respuesta (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(250)
);

CREATE TABLE evaluacion (
    id_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_actividad INT,
    id_respuesta INT,
    fecha_evaluacion DATE NOT NULL,
    comentario VARCHAR(250),
    FOREIGN KEY (id_actividad) REFERENCES actividad(id_actividad) ON DELETE CASCADE,
    FOREIGN KEY (id_respuesta) REFERENCES respuesta(id_respuesta) ON DELETE CASCADE
);

-- Insertar categorías
INSERT INTO categoria (descripcion) VALUES ('Física'), ('Mental'), ('Nutricional');

-- Insertar metaes
INSERT INTO meta (descripcion) 
VALUES ('Correr'), 
       ('Ciclismo'), 
       ('Levantamiento de pesas'),
       ('Yoga'), 
       ('Natación'), 
       ('Caminatas'),
       ('Aerobicos o baile'),
       ('Kickboxing o Boxeo'),

       ('Meditación'),
       ('Mindfulness (Atención plena)'), 
       ('Escribir un diario'),
       ('Terapia cognitivo-conductual (TCC)'), 
       ('Respiración profunda'),
       ('Terapia artística (pintar, dibujar)'),

       ('Planificación de comidas (dieta)'), 
       ('Seguimiento del consumo de agua'), 
       ('Reducir ingesta de azúcar'), 
       ('Consumir frutas y verduras'), 
       ('Aumento de proteínas en la dieta');

-- Insertar objetivos
INSERT INTO objetivo (descripcion) VALUES ('Bajar peso'), ('Mejorar resistencia cardiovascular'), ('Aumentar velocidad'),
('Fortalecer piernas'), ('Resistencia cardiovascular'), ('Mejorar tiempos'),
('Aumentar masa muscular'), ('Tonificar cuerpo'), ('Mejorar fuerza'),
('Mejorar flexibilidad'), ('Reducir estrés'), ('Mejorar equilibrio'),
('Mejorar resistencia cardiovascular'), ('Fortalecer músculos'), ('Relajar cuerpo y mente'),
('Reducir estrés'), ('Mejorar tiempos'), ('Quemar calorías'),
('Quemar calorías'), ('Mejorar coordinación'), ('Reducir estrés'),
('Mejorar técnica'), ('Mejorar defensa personal'), ('Aumentar fuerza'),

('Reducir estrés'), ('Mejorar concentración'), ('Aumentar autocontrol'), ('Mejorar salud emocional'),
('Desarrollar conciencia del momento presente'), ('Reducir ansiedad'), ('Mejorar bienestar emocional'),
('Procesar emociones'), ('Mejorar autocomprensión'), ('Identificar patrones emocionales'),
('Cambiar patrones de pensamiento negativo'), ('Mejorar autoestima'), ('Desarrollar habilidades de afrontamiento'),
('Reducir estrés'), ('Aumentar la calma en situaciones difíciles'), ('Mejorar la atención y concentración'),
('Procesar emociones complejas'), ('Mejorar autocomprensión'), ('Fomentar creatividad y bienestar mental'),

('Comer de forma más equilibrada'), ('Reducir peso'), ('Evitar el consumo de comida rápida'),
('Mantener una buena hidratación'), ('Incrementar los niveles de energía'), ('Mejorar la salud de la piel'),
('Mejorar niveles de azucar'), ('Reducir riesgo de diabetes'), ('Controlar peso corporal'),
('Aumentar consumo de nutrientes'), ('Fortalecer sistema inmunológico'), ('Reducir riesgo de enfermedades crónicas'),
('Desarrollar masa muscular'), ('Mejorar recuperación muscular tras el ejercicio'), ('Fortalecer sistema inmunológico');

-- Insertar meta-objetivo
INSERT INTO meta_objetivo (id_categoria, id_meta, id_objetivo) 
VALUES (1, 1, 1), (1, 1, 2), (1, 1, 3),
(1, 2, 4), (1, 2, 5), (1, 2, 6),
(1, 3, 7), (1, 3, 8), (1, 3, 9),
(1, 4, 10), (1, 4, 11), (1, 4, 12),
(1, 5, 13), (1, 5, 14), (1, 5, 15),
(1, 6, 16), (1, 6, 17), (1, 6, 18),
(1, 7, 19), (1, 7, 20), (1, 7, 21),
(1, 8, 22), (1, 8, 23), (1, 8, 24),

(2, 9, 25), (2, 9, 26), (2, 9, 27),
(2, 10, 28), (2, 10, 29), (2, 10, 30),
(2, 11, 31), (2, 11, 32), (2, 11, 33),
(2, 12, 34), (2, 12, 35), (2, 12, 36),
(2, 13, 37), (2, 13, 38), (2, 13, 39),
(2, 14, 40), (2, 14, 41), (2, 14, 42),

(3, 15, 43), (3, 15, 44), (3, 15, 45),
(3, 16, 46), (3, 16, 47), (3, 16, 48),
(3, 17, 49), (3, 17, 50), (3, 17, 51),
(3, 18, 52), (3, 18, 53), (3, 18, 54),
(3, 19, 55), (3, 19, 56), (3, 19, 57);

-- Inserts para la tabla semana
INSERT INTO semana (descripcion) VALUES ('Lunes');
INSERT INTO semana (descripcion) VALUES ('Martes');
INSERT INTO semana (descripcion) VALUES ('Miércoles');
INSERT INTO semana (descripcion) VALUES ('Jueves');
INSERT INTO semana (descripcion) VALUES ('Viernes');
INSERT INTO semana (descripcion) VALUES ('Sábado');
INSERT INTO semana (descripcion) VALUES ('Domingo');
INSERT INTO semana (descripcion) VALUES ('Todos los días');

-- Inserts para la tabla respuesta
INSERT INTO respuesta (descripcion) VALUES ('Bien');
INSERT INTO respuesta (descripcion) VALUES ('Mal');
INSERT INTO respuesta (descripcion) VALUES ('Regular');

