import { InputType } from '../../../shared/ui/input/Input';
import type { SearchFilterValues } from '../model/searchFilterValues';

type InputField = {
  name: keyof Pick<SearchFilterValues, 'priceTo' | 'roomsFrom' | 'district' | 'metro'>;
  idSuffix: string;
  label: string;
  placeholder: string;
  type?: InputType;
  min?: string;
};

export const inputFields: InputField[] = [
  {
    name: 'priceTo',
    idSuffix: 'price',
    label: 'Цена до, ₽',
    placeholder: 'Например, 35 000',
    type: InputType.Number,
    min: '0',
  },
  {
    name: 'roomsFrom',
    idSuffix: 'rooms',
    label: 'Комнат от',
    placeholder: 'Любое число',
    type: InputType.Number,
    min: '0',
  },
  { name: 'district', idSuffix: 'district', label: 'Район', placeholder: 'Любой район' },
  { name: 'metro', idSuffix: 'metro', label: 'Метро', placeholder: 'Любая станция' },
];
