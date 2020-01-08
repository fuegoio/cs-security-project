# Fake front-end : hangman

This folder contains a Javascript fake app that is used to attack the Password manager located on the same network as the target machine. The javascript here will query the Singularity server multiple times until it gets no token in the response, meaning that the DNS Rebinding occured.

Then, the result of the password manager fetch query will be posted to the Results server.
