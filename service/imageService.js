export const getUserImageSrc = imagePath => {
    if(imagePath && typeof imagePath == 'string'){
        return {uri : imagePath}
    } else {
        return require('../assets/images/avatar2.svg')
    }
}
