import shaman from 'shaman';
import { correlation } from './correlation';
import { getUniqueValues } from './utils';

export const categoricalRegression = (categorical, numeric) => {
  // Remove nulls
  const [validCat, validNum] = categorical.reduce((nonNull, v, i) => {
    if (categorical[i] !== null && numeric[i] !== null) {
      nonNull[0].push(categorical[i]);
      nonNull[1].push(numeric[i]);
    }

    return nonNull;
  }, [[], []]);

  const categories = getUniqueValues(validCat);

  // XXX: What should be returned here?
  if (categories.length === 1) return 0;

  // n - 1 dummy categories
  const cats = categories.slice(0, -1);

  // Setup multiple regression
  const x = validCat.map(value => {
    return [...cats.map(category => value === category ? 1 : 0)];
  });

  const lr = new shaman.LinearRegression(x, validNum, { algorithm: 'NormalEquation' });

  const p = [];
  lr.train(err => {
    if (err) console.log(err);

    x.forEach(x => p.push(lr.predict(x)));
  });

  return correlation(validNum, p);
};