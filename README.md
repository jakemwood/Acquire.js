Acquire.js (board-tester)
==========
This is a simplified version of Acquire.js (a Node.js implementation of the board game Acquire) which exposes an XML API to perform moves on provided Acquire boards.

## About Node.js

Taken from the [Node.js web site](http://www.nodejs.org):

> Node.js is a platform built on Chrome's JavaScript runtime for easily building fast, scalable network applications. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications that run across distributed devices.

## XML API
The XML API communicates using standard input and output.

### Input Example
	<growing row="B" column="10">
		<board>
			<hotel name="American">
				<tile row="B" column="7" />
				<tile row="B" column="8" />
				<tile row="B" column="9" />
			</hotel>
		</board>
	</growing>

### Output Example
    <board>
        <hotel name="American">
        	<tile row="B" column="7" />
        	<tile row="B" column="8" />
        	<tile row="B" column="9" />
        	<tile row="B" column="10" />
        </hotel>
    </board>

## Development Notes

### Data Types
There are many common data types used throughout the Acquire.js code.  To avoid accidental inconsistencies and data duplication, you can find these common data types in **Data Types.txt**.

### Running board-tester on CCIS Lab Machines
There is a provided bash script called **board-tester** which will execute the necessary commands to run the  Acquire.js board tester.  However, you may need to grant "execute" permissions to the provided **node** binary, as well as the **board-tester** bash script, in order to successfully execute the tester.

### Running board-tester on any other machine
The included **node** binary and **board-tester** script should run on any Linux machine.

In order to run this code on another machine, first [download Node.js](http://www.nodejs.org/download/) for your operating system.  Then, once you have it properly installed, you should be able to…

1. Change directory into the acquire.js directory
2. Run `node acquire` from the terminal.