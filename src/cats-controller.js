const boom = require('boom')
const catsStorage = require('./cats-storage')

/**
 * Получение и обработка поискового запроса по котам с клиента
 * @param {*} req - параметры поискового запроса, переданные с клиента
 * @param {*} res - список найденных (или нет) котов
 */
function searchCatsByParams(req, res) {
  const searchParams = {
    name: req.body.name,
    gender: req.body.gender,
  }

  req.log.info(
    `searching for cats with name like ${searchParams.name} and ${searchParams.gender}`
  )

  return validateName(searchParams.name)
    .then(() => catsStorage.findCatsByParams(searchParams))
    .then(foundCats => {
      return res.json(groupNamesAndSort(foundCats))
    })
    .catch(err =>
      res.status(500).json(boom.internal('unable to find cats', err))
    )
}

/**
 * Получение списка всех котов с учетом фильтра по полу, которые есть в БД
 * @param {*} req - параметры, с которыми запрашивается список (пол котов)
 * @param {*} res - отсортированный массив котов
 */
function getAllCats(req, res) {
  const { order, gender } = req.query
  const reverseSort = (order || 'asc').toLowerCase() === 'desc'

  req.log.info(`getting all cats with order = ${order} and gender = ${gender}`)

  catsStorage
    .allCats(gender)
    .then(storedCats => res.json(groupNamesAndSort(storedCats, reverseSort)))
    .catch(err =>
      res.status(500).json(boom.internal('unable to get all cats', err))
    )
}
/**
 * Поиск списка котов для списка подсказок
 * @param {*} req  - поисковый запрос и лимит на количество имен, возращаемых в ответе
 * @param {*} res
 */
function searchCatsByNamePattern(req, res) {
  const { name, limit } = req.query
  req.log.info(`searching for cats with name like ${name} limit ${limit}`)

  return validateName(name)
    .then(() => catsStorage.findCatByNamePattern(name, Number(limit)))
    .then(foundCats => res.json(foundCats))
    .catch(err =>
      res.status(500).json(boom.internal('unable to find cats', err))
    )
}

/**
 * Добавление новых котов
 * @param {*} req - параметры, пришедшие от клиента и содержащие информацию о новом коте (имя, пол)
 * @param {*} res  - ответ, который отправляем клиенту после выполнения функции
 */
function addCats(req, res) {
  const { cats } = req.body

  req.log.info(`adding cats: ${JSON.stringify(cats)}`)

  if (isEmpty(cats)) {
    return res.status(400).json(boom.badRequest('cats is absent'))
  }

  for (let i = 0; i < cats.length; i++) {
    if (isEmpty(cats[i].name)) {
      return res.status(400).json(boom.badRequest('cat name is absent'))
    }
  }

  Promise.all(cats.map(cat => validateName(cat.name)))
    .then(() => catsStorage.addCats(cats))
    .then(storedCats =>
      res.json({
        cats: storedCats,
      })
    )
    .catch(err => {
      res
        .status(500)
        .json(boom.internal('unable to save cats', { message: err.message }))
    })
}

/**
 * Сохранение описание кота в БД
 * @param {*} req
 * @param {*} res
 */
function saveCatDescription(req, res) {
  const { catId, catDescription } = req.body

  req.log.info(`saving cat description: ${catId}: ${catDescription}`)

  if (isEmpty(catId) || isEmpty(catDescription)) {
    return res.status(400).json(boom.badRequest('cat id is absent'))
  }

  catsStorage
    .saveCatDescription(catId, catDescription)
    .then(catFound => {
      if (catFound == null) {
        return res.status(404).json(boom.notFound('cat not found'))
      }

      return res.json({ cat: catFound })
    })
    .catch(err =>
      res.status(500).json(boom.internal('unable to save cat description', err))
    )
}

function getCatById(req, res) {
  const { id } = req.query
  if (isEmpty(id)) {
    return res.status(400).json(boom.badRequest('cat id is absent'))
  }

  catsStorage
    .findCatById(id)
    .then(catFound => {
      if (catFound == null) {
        return res.status(404).json(boom.notFound('cat not found'))
      }

      return res.json({ cat: catFound })
    })
    .catch(err =>
      res.status(500).json(boom.internal('unable to find cat', err))
    )
}

function isEmpty(value) {
  return value == null || value.length == 0
}

/**
 * Группировка и сортировка полученных котов с характеристиками из БД
 * @param {*} cats - список строк котов с характеристиками, которые возвращаются клиенту
 */
function groupNamesAndSort(cats, reverseSort) {
  const groups = groupByFirstLetter(cats)
  const sorterGroup = sortGroupAlphabetically(groups, reverseSort)
  const count = countNames(sorterGroup)

  return {
    groups: sorterGroup,
    count,
  }
}

/**
 * Группировка котов (список объектов) по первой букве
 * @param {*} cats - список объектов котов с характеристиками, которые возвращаются клиенту
 */
function groupByFirstLetter(cats) {
  const groups = {}

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i]
    const name = capitalizeFirstLetter(cat.name)
    const title = name.charAt(0)

    if (groups[title] == null) {
      groups[title] = [cat]
    } else {
      groups[title].push(cat)
    }
  }

  return groups
}

/**
 * Сортировка групп котов в алфавитном порядке
 * @param {*} groups - мапа групп готов, содержит title и список объектов
 */
function sortGroupAlphabetically(groups, reverseSort) {
  const keysSortedAlphabetically = Array.from(Object.keys(groups)).sort()
  const sorterGroup = []

  if (reverseSort) {
    keysSortedAlphabetically.reverse()
  }

  for (let i = 0; i < keysSortedAlphabetically.length; i++) {
    const key = keysSortedAlphabetically[i]
    const group = {
      title: key,
      cats: groups[key], //.sort()
    }
    sorterGroup.push(group)
  }

  return sorterGroup
}

/**
 * Вычисление количества найденных имен в списке
 * @param {*} groups - список групп с именами
 */
function countNames(groups) {
  let count = 0
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    group['count'] = group.cats.length
    count = count + group.count
  }
  return count
}

/**
 * Модификация записи имени кота в запись с большой буквы
 * @param {*} string - имя кота
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Получение правил валидации имен
 * @param {*} req - запрос, отправляемый клиентом (содержит имя кота)
 * @param {*} res - ответ, отправляемый клиенту в виде json списка с regex-правилами
 */
function getCatValidationRules(req, res) {
  return catsStorage
    .findCatsValidationRules()
    .then(foundRules => res.json(foundRules))
    .catch(err =>
      res
        .status(500)
        .json(boom.internal('unable to find cats validation rules', err))
    )
}

/**
 * Валидация имени по regex-правилам, хранящимся в БД
 * @param {*} name - имя кота, переданное в строке поиска
 */
function validateName(name) {
  return catsStorage.findCatsValidationRules().then(validationRules => {
    for (let i = 0; i < validationRules.length; i++) {
      const { description, regex } = validationRules[i]
      const validationRegex = new RegExp(regex)

      const isValid = name.search(validationRegex) > -1
      if (!isValid) {
        console.error(description)
        throw new Error(description)
      }
    }

    return null
  })
}

function deleteCatByName(req, res) {}

/**
 * Добавление изображения коту
 */
function uploadCatImage(req, res, next) {
  if (!req.file) {
    res.status(400).json(boom.internal('file is required', err))
    return next(err)
  }

  catsStorage
    .uploadCatImage(req.file.filename, req.params.id)
    .then(() => res.json({ fileUrl: '/photos/' + req.file.filename }))
    .catch(err =>
      res.status(500).json(boom.internal('unable to insert db', err))
    )
}

function getCatImages(req, res) {
  const catId = req.params.catId

  if (isEmpty(catId)) {
    return res.status(400).json(boom.badRequest('image id is absent'))
  }

  catsStorage
    .getCatImages(catId)
    .then(imageFound => {
      const images = (imageFound || []).map(obj => '/photos/' + obj.link)

      return res.json({ images: images })
    })
    .catch(err =>
      res.status(500).json(boom.internal('unable to find image', err))
    )
}

module.exports = {
  searchCatsByParams,
  searchCatsByNamePattern,
  addCats,
  deleteCatByName,
  getCatById,
  saveCatDescription,
  getCatValidationRules,
  uploadCatImage,
  getCatImages,
  getAllCats,
}
