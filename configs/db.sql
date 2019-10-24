CREATE TYPE gender AS ENUM ('male', 'female', 'unisex');

CREATE TABLE Cats (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    gender gender,
    CONSTRAINT unique_name UNIQUE(name)
);
CREATE TABLE Cats_Validations (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    regex TEXT NOT NULL
);

-- Add name validation rules:
INSERT INTO Cats_Validations (description, regex) VALUES
  ('Цифры не принимаются!', '^\D*$'),
  ('Только имена на русском!', '^[а-яА-Я\s-]*$'),
  ('Из спецсимволов можно только тире и только посередине имени', '^([\d\wа-яА-Я]+|[\d\wа-яА-Я]+[-\s]|[\d\wа-яА-Я]+[-\s][\d\wа-яА-Я]+)$');

-- Feature 8 upload images:
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    link VARCHAR NOT NULL,
    id_cat INT NOT NULL
  constraint images_cats__fk
   references cats ("id")
    on delete cascade
);

-- Feature 2-6: Add likes and dislikes names
ALTER TABLE Cats
    ADD COLUMN likes SMALLINT NOT NULL DEFAULT 0
    CONSTRAINT likes_positive CHECK (likes >= 0);
ALTER TABLE Cats
    ADD COLUMN dislikes SMALLINT NOT NULL DEFAULT 0
    CONSTRAINT dislikes_positive CHECK (dislikes >= 0);


-- Bug (gender):
UPDATE cats SET gender = 'unisex' WHERE gender IS NULL;
ALTER TABLE cats ALTER COLUMN gender SET NOT NULL;

-- Bug: add validator for insert name
CREATE TYPE Validation_Type AS ENUM ('search', 'add');
ALTER TABLE Cats_Validations ADD COLUMN type Validation_Type NOT NULL DEFAULT 'search';

INSERT INTO Cats_Validations (description, regex, type) VALUES
    ('Цифры не принимаются!', '^\D*$', 'add'),
    ('Из спецсимволов можно только тире и только посередине имени', '^([\d\wа-яА-Я]+[-\s]?[\d\wа-яА-Я]+)$', 'add'),
    ('Только имена на русском!', '^[а-яА-Я\s-]*$', 'add');

-- Feature 4 colors and characters
create table cats_characters
(
    id        serial  not null
        constraint cats_characters_pk
            primary key,
    character varchar not null
);

alter table cats_characters
    owner to cats;

create table cats_colors
(
    id    serial not null
        constraint cats_colors_pk
            primary key,
    color varchar
);

alter table cats_colors
    owner to cats;

create unique index cats_colors_color_uindex
    on cats_colors (color);

create table characters_ids
(
    id_cat integer not null
        constraint characters_ids_cats_id_fk
            references cats,
    id_character integer not null
        constraint characters_ids_cats_characters_id_fk
            references cats_characters
);

alter table characters_ids
    owner to cats;

create table colors_ids
(
    id_cat   integer not null
        constraint colors_ids_cats_id_fk
            references cats,
    id_color integer not null
        constraint colors_ids_cats_colors_id_fk
            references cats_colors
);

alter table colors_ids
    owner to cats;
