## Custome provider

In this app I am using custo providers in the mailService.
The MailService currently creates the transporter itself inside its constructor. With a custom provider, the DI container creates the transporter, and MailService just receives it.

And we can achieve diffrent transporter for diffrent environment 