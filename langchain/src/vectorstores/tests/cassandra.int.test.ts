/* eslint-disable no-process-env */
import { test, expect, describe } from "@jest/globals";

import { CassandraStore } from "../cassandra.js";
import { OpenAIEmbeddings } from "../../embeddings/openai.js";
import { Document } from "../../document.js";

// yarn test:single /langchain/src/vectorstores/tests/cassandra.int.test.ts
describe.skip("CassandraStore", () => {
  const cassandraConfig = {
    cloud: {
      secureConnectBundle: process.env.CASSANDRA_SCB as string,
    },
    credentials: {
      username: "token",
      password: process.env.CASSANDRA_TOKEN as string,
    },
    keyspace: "test",
    dimensions: 1536,
    table: "test",
    indices: [
      {
        name: "name",
        value: "(name)",
      },
    ],
    primaryKey: {
      name: "id",
      type: "int",
    },
    metadataColumns: [
      {
        name: "name",
        type: "text",
      },
    ],
  };

  test("CassandraStore.fromText", async () => {
    const vectorStore = await CassandraStore.fromTexts(
      ["I am blue", "Green yellow purple", "Hello there hello"],
      [
        { id: 2, name: "Alex" },
        { id: 1, name: "Scott" },
        { id: 3, name: "Bubba" },
      ],
      new OpenAIEmbeddings(),
      cassandraConfig
    );

    const results = await vectorStore.similaritySearch(
      "Green yellow purple",
      1
    );
    expect(results).toEqual([
      new Document({
        pageContent: "Green yellow purple",
        metadata: { id: 1, name: "Scott" },
      }),
    ]);
  });

  test("CassandraStore.fromExistingIndex", async () => {
    await CassandraStore.fromTexts(
      ["Hey", "Whats up", "Hello"],
      [
        { id: 2, name: "Alex" },
        { id: 1, name: "Scott" },
        { id: 3, name: "Bubba" },
      ],
      new OpenAIEmbeddings(),
      cassandraConfig
    );

    const vectorStore = await CassandraStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      cassandraConfig
    );

    const results = await vectorStore.similaritySearch("Whats up", 1);
    expect(results).toEqual([
      new Document({
        pageContent: "Whats up",
        metadata: { id: 1, name: "Scott" },
      }),
    ]);
  });

  test("CassandraStore.fromExistingIndex (with filter)", async () => {
    await CassandraStore.fromTexts(
      ["Hey", "Whats up", "Hello"],
      [
        { id: 2, name: "Alex" },
        { id: 1, name: "Scott" },
        { id: 3, name: "Bubba" },
      ],
      new OpenAIEmbeddings(),
      cassandraConfig
    );

    const vectorStore = await CassandraStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      cassandraConfig
    );

    const results = await vectorStore.similaritySearch("H", 1, {
      name: "Bubba",
    });
    expect(results).toEqual([
      new Document({
        pageContent: "Hello",
        metadata: { id: 3, name: "Bubba" },
      }),
    ]);
  });
});
