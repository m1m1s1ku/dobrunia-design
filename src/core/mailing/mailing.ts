import Elara from "../elara";

/**
 * Mailing utilities
 */
const Mailing = {
    error: 'An error occured, please retry later. 😔',
    success: 'Thanks for your message ! I will try to reply as soon as possible 😀',
    /**
     * contact someone
     * @param {HTMLButtonElement} submit button
     * @param {[key: string]: HTMLButtonElement | Elara.InputElement | HTMLElement} fields
     * @param {string} url post url
     */
    contact: async (fields: {
            submit: HTMLButtonElement;
            name: Elara.InputElement;
            email: Elara.InputElement;
            message: Elara.InputElement;
            form: HTMLElement;
        }, url: string): Promise<boolean> => {
        let isValid = true;

        const check = (input: Elara.InputElement) => {
            return input.validate();
        };

        // Check each
        const inputs = [fields.name, fields.email, fields.message];
        inputs.forEach((input: Elara.InputElement) => check(input) ? input.invalid = false : input.invalid = true);
        inputs.forEach((input) => {
            if(input.invalid && isValid){
                isValid = false;
            }
        });

        if(!isValid){
            return isValid;
        }
        
        // disable everyone
        fields.submit.disabled = true;
        inputs.forEach((input) => input.disabled = true);

        const formData = new FormData();
        formData.append('name', fields.name.value);
        formData.append('email', fields.email.value);
        formData.append('message', fields.message.value);

        // @tool: uncomment to disable mail sending
        // if(location.hostname.indexOf('localhost') !== -1) { form.classList.add('sended'); return; }

        // Send through Gmail

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.onreadystatechange = () => {
                if (xhr.status === 200) {
                    fields.form.classList.add('sended');
                    resolve(true);
                }
            };
            xhr.onerror = () => {
                reject(false);
            };
            xhr.send(formData);
        });
    }
};

export default Mailing;
