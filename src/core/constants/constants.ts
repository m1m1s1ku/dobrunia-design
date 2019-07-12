import Elara from '../elara';
import { svg } from 'lit-html';

/**
 * App constants
 */
const Constants = {
    modes: {
        default: 'day' as Elara.Modes
    },
    title: 'Dobrunia Design',
    logo: (width: number) => svg`<svg id="elara" style="width: ${width}px" data-name="Elara logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 167.32 67.78"><defs><style>.complementary{ fill: #f0f0f0;}.primary{fill: #fff;}</style></defs>
    <title>Elara logo</title>
    <path class="complementary" d="M8.38,21.56V36.7H31.64v7H8.46v15H34.77v6.81H1.24V15.07h33.6v6.49Z"/> <!-- ' -->
    <path class="primary" d="M85.69,31.69c.16-1.56.3-3,.47-4.65h6.56V65.28c-4.68,2.14-5.8-1-6.84-5.09C80.79,64.51,75.2,67.58,69,65.31a26.46,26.46,0,0,1-10.71-7.58C52.62,50.9,53.84,39,60.09,32.48,67,25.19,75,24.89,85.69,31.69ZM74,58.79a12.49,12.49,0,1,0,0-25,12.49,12.49,0,0,0,0,25Z"/><!-- E -->
    <path class="primary" d="M165.69,65.35c-5.11,2.14-5.71-1.79-6.9-4.77C147,68,139.26,67.52,132.16,59.12c-6.1-7.23-5.86-19.1.53-26.17,7-7.78,15.54-8.25,26-1.14.14-1.61.26-3,.41-4.71h6.57ZM147,58.79a12.49,12.49,0,1,0-.13-25,12.49,12.49,0,0,0,.13,25Z"/> <!-- L -->
    <path class="primary" d="M40.52,65.62V12.12h6.57v53.5Z"/> <!-- A -->
    <path class="primary" d="M104.36,25.91l6,5,12.52-5.49c-.27,3.75-.42,5.83-.56,7.85-9.93,1.9-12.58,5.1-12.73,15.33-.08,5.63,0,11.26,0,17h-6.34V27.41Z"/> <!-- R -->
    <path class="primary" d="M18.37.59l7.85,3.56c-4.36,3.89-8,8.3-15.1,6.14Z"/> <!-- A -->
</svg>`,
    defaults: {
        route: 'home'
    }
};

export default Constants;