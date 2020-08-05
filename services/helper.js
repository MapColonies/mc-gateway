'use strict';

module.exports = class Helper {

    constructor(logger) {
        this.logger = logger;
    }

    sleep(time) {
        this.logger.log('info', `Going to sleep for ${time} ms `);
        return new Promise(resolve => {
            setTimeout(() => {
                return resolve();
            }, time)
        })
    };

}
