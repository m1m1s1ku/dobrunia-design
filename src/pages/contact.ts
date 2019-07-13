import { html, TemplateResult } from 'lit-html';
import { css } from 'lit-element';

import Page from '../core/strategies/Page';
import { repeat } from 'lit-html/directives/repeat';

class Contact extends Page {
    public static readonly is: string = 'ui-contact';

    public get head(){
        return {
            title: null,
            description: null,
            type: null,
            image: null,
            slug: null
        };
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .contact {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                min-height: 60vh;
                padding: 2em;
            }

            .side {
                display: flex;
                flex-direction: column;
                padding: 1em;
            }

            .opening {
                font-weight: bold;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        const hours = new Map<string, string>();

        const weekdays = [ 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const openings = ['Fermé', '11h-19h', '11h-19h', '11h-19h', '13h-17h', '13h-17h', '10h-17h'];

        weekdays.forEach((day, idx) => {
            hours.set(day, openings[idx]);
        });

        return html`
        <div class="contact" role="main">
            <div class="side">
                <div class="first">
                    <h2>Faisons quelque chose d'incroyable ensemble !</h2>
                    <h3>Adresse</h3>
                    <p>9 Rue Miron, 06000 Nice</p>
                    <p>info@dobruniadesign.com</p>
                    <p>06 50 48 74 41</p>
                </div>

                <div class="second">
                    <h3>Horaires de l'atelier :</h3>
                    <div class="hours">
                    ${repeat(hours, hour => {
                        return html`
                        <div class="hour">
                            <span class="day">${hour[0]}</span> | <span class="opening">${hour[1]}</span>
                        </div>
                        `;
                    })}
                    </div>
                </div>
            </div>
            <div class="side">
                <iron-image sizing="cover" style="width: 33vw; height: 100%" src="https://res.cloudinary.com/ghostfly/image/upload/c_fill,w_1000/bmjlubngyypftackz4eq.jpg"></iron-image>
            </div>
        </div>
        `;
    }
}
customElements.define(Contact.is, Contact);