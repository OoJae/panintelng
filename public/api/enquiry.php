<?php
/**
 * Panintel enquiry handler.
 *
 * Replaces a `mailto:` form POST, which browsers now block with "the
 * information you're about to submit is not secure" and which, if a visitor
 * clicked through anyway, produced a mail draft full of URL-encoded noise.
 *
 * Works with and without JavaScript: fetch() gets JSON back, a plain form POST
 * gets an HTML page.
 */
declare(strict_types=1);

const MAIL_TO      = 'technical@panintelng.com';
// Sends as an address that genuinely exists on this domain. A From: on a
// mailbox the server does not host risks bounces and spam scoring; Reply-To
// still carries the enquirer, so replying in webmail reaches them.
const MAIL_FROM    = 'technical@panintelng.com';
const SITE         = 'https://www.panintelng.com';
const MIN_SECONDS  = 3;                          // humans do not fill a form faster than this
const RATE_LIMIT   = 5;                          // submissions per IP per hour
const MAX_LEN      = ['name' => 120, 'company' => 160, 'email' => 254, 'stage' => 80, 'scope' => 5000];

$wantsJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false
    || strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';

function respond(int $status, string $message, bool $ok = false)
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $safe  = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $title = $ok ? 'Thank you' : 'Something went wrong';
    echo <<<HTML
    <!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex"><title>{$title} — Panintel Projects Nigeria Limited</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F6F4F0;color:#14120F;
           font:16px/1.6 system-ui,sans-serif;padding:2rem}
      .card{max-width:34rem;text-align:center}
      h1{font-size:clamp(1.9rem,4vw,3rem);line-height:1.05;letter-spacing:-.02em;margin:0 0 1rem}
      p{color:#57524B;margin:0 0 2rem}
      a{display:inline-block;background:#FFC000;color:#14120F;padding:.9rem 1.6rem;text-decoration:none;
        font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600}
    </style></head><body><div class="card">
    <h1>{$title}</h1><p>{$safe}</p><a href="/">Back to home</a>
    </div></body></html>
    HTML;
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, 'This address only accepts form submissions.');
}

// --- spam gates, none of which a real visitor ever sees ---------------------
if (($_POST['website'] ?? '') !== '') {
    respond(200, 'We will be in touch.', true);   // honeypot: pretend success
}
$started = (int) ($_POST['t'] ?? 0);
if ($started > 0 && (time() - $started) < MIN_SECONDS) {
    respond(200, 'We will be in touch.', true);   // submitted too fast to be human
}

$ip    = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$stamp = sys_get_temp_dir() . '/panintel_rl_' . sha1($ip);
$hits  = is_file($stamp) ? (array) json_decode((string) file_get_contents($stamp), true) : [];
$hits  = array_values(array_filter($hits, static fn($t) => $t > time() - 3600));
if (count($hits) >= RATE_LIMIT) {
    respond(429, 'Too many enquiries from this connection. Please try again later, or email ' . MAIL_TO . '.');
}

// --- validate ---------------------------------------------------------------
$field = static function (string $key) : string {
    $v = trim((string) ($_POST[$key] ?? ''));
    // Strip anything that could inject a mail header.
    return str_replace(["\r", "\n", "%0a", "%0d"], ' ', $v);
};

$name    = $field('name');
$company = $field('company');
$email   = $field('email');
$stage   = $field('stage');
$scope   = trim((string) ($_POST['scope'] ?? ''));

$values = compact('name', 'company', 'email', 'stage', 'scope');
foreach (MAX_LEN as $key => $limit) {
    if (mb_strlen($values[$key]) > $limit) {
        respond(422, 'One of the fields is longer than we can accept.');
    }
}
if ($name === '' || $email === '' || $scope === '') {
    respond(422, 'Please give your name, your email address and a short description of the scope.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, 'That email address does not look right. Please check it and try again.');
}

// --- send -------------------------------------------------------------------
$body = "New enquiry from panintelng.com\n"
      . str_repeat('-', 46) . "\n\n"
      . "Name:     {$name}\n"
      . 'Company:  ' . ($company !== '' ? $company : '—') . "\n"
      . "Email:    {$email}\n"
      . 'Stage:    ' . ($stage !== '' ? $stage : '—') . "\n\n"
      . "Scope\n-----\n{$scope}\n\n"
      . str_repeat('-', 46) . "\n"
      . 'Received: ' . gmdate('D, d M Y H:i') . " UTC\n"
      . "IP:       {$ip}\n";

$headers = [
    // From must be on this domain for SPF to pass; Reply-To carries the
    // enquirer so hitting reply in webmail goes to the right person.
    'From: Panintel website <' . MAIL_FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: panintelng.com',
];

$subject = 'Enquiry — ' . ($company !== '' ? $company : $name);
$sent = @mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if (!$sent) {
    respond(500, 'We could not send that just now. Please email ' . MAIL_TO . ' directly.');
}

$hits[] = time();
@file_put_contents($stamp, json_encode($hits), LOCK_EX);

respond(200, 'We will reply to ' . $email . '.', true);
