import localFont from 'next/font/local'


// Font files can be colocated inside of `app`
export const monogram = localFont({
    src: [
      {
        path: '../../public/monogram-extended.ttf',
        weight: '400',
        style: 'normal',
      },
      {
        path: '../../public/monogram-extended-italic.ttf',
        weight: '400',
        style: "italic"
      }
    ],
    
})